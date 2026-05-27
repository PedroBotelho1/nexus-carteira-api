import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const COINGECKO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BRL: 'brl',
};

// Explica para o TypeScript exatamente o que a CoinGecko vai devolver
type CoinGeckoResponse = Record<string, Record<string, number>>;

@Injectable()
export class SwapService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async fetchExchangeRate(
    fromToken: string,
    toToken: string,
  ): Promise<number> {
    const fromId = COINGECKO_MAP[fromToken.toUpperCase()];
    const toId = COINGECKO_MAP[toToken.toUpperCase()];

    if (!fromId || !toId) {
      throw new BadRequestException('Moeda não suportada.');
    }

    // --- INÍCIO DO REDIS ---
    const cacheKey = `cotacao-${fromToken.toUpperCase()}-${toToken.toUpperCase()}`;
    const cachedRate = await this.cacheManager.get<number>(cacheKey);

    if (cachedRate) {
      console.log('⚡ Pegou a cotação do Redis na nuvem!');
      return cachedRate;
    }
    // --- FIM DA CHECAGEM DO CACHE ---

    try {
      console.log('🐢 Buscando cotação na CoinGecko...');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=${toId}`;
      const response = await fetch(url);
      const data = (await response.json()) as CoinGeckoResponse;

      let rateToReturn: number | null = null;

      if (data[fromId] && data[fromId][toId]) {
        rateToReturn = data[fromId][toId];
      } else {
        const urlRev = `https://api.coingecko.com/api/v3/simple/price?ids=${toId}&vs_currencies=${fromId}`;
        const responseRev = await fetch(urlRev);
        const dataRev = (await responseRev.json()) as CoinGeckoResponse;

        if (dataRev[toId] && dataRev[toId][fromId]) {
          rateToReturn = 1 / dataRev[toId][fromId];
        }
      }

      if (rateToReturn) {
        // Salvando no Redis por 60 segundos antes de devolver a cotação
        await this.cacheManager.set(cacheKey, rateToReturn);
        return rateToReturn;
      }

      throw new Error('Cotação não encontrada na API.');
    } catch {
      console.log('⚠️ CoinGecko falhou. Usando plano de emergência...');
      // PLANO DE EMERGÊNCIA
      const rates: Record<string, number> = {
        'BTC-BRL': 350000,
        'ETH-BRL': 18000,
        'USDT-BRL': 5.5,
      };

      const direct =
        rates[`${fromToken.toUpperCase()}-${toToken.toUpperCase()}`];
      if (direct) {
        await this.cacheManager.set(cacheKey, direct);
        return direct;
      }

      const rev = rates[`${toToken.toUpperCase()}-${fromToken.toUpperCase()}`];
      if (rev) {
        const revRate = 1 / rev;
        await this.cacheManager.set(cacheKey, revRate);
        return revRate;
      }

      throw new BadRequestException(
        'Erro ao buscar cotação. Tente novamente mais tarde.',
      );
    }
  }

  async getQuoteDetails(fromToken: string, toToken: string, amount: number) {
    const rate = await this.fetchExchangeRate(fromToken, toToken);

    const amountDestinoBruto = amount * rate;
    const taxaAplicada = amountDestinoBruto * 0.015;
    const amountDestinoLiquido = amountDestinoBruto - taxaAplicada;

    return {
      cotaçãoUsada: rate,
      quantidadeOrigem: amount,
      quantidadeDestino: amountDestinoLiquido,
      taxaCobrada: taxaAplicada,
    };
  }

  async executeSwap(
    userId: string,
    fromToken: string,
    toToken: string,
    amount: number,
  ) {
    const quote = await this.getQuoteDetails(fromToken, toToken, amount);

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Carteira não encontrada.');

    const fromBalance = await this.prisma.balance.findUnique({
      where: { walletId_token: { walletId: wallet.id, token: fromToken } },
    });

    const toBalance = await this.prisma.balance.findUnique({
      where: { walletId_token: { walletId: wallet.id, token: toToken } },
    });

    if (!fromBalance || fromBalance.amount < amount) {
      throw new BadRequestException(
        `Saldo insuficiente de ${fromToken} para realizar o Swap.`,
      );
    }

    const toBalanceAmount = toBalance ? toBalance.amount : 0;
    const newFromBalance = fromBalance.amount - amount;
    const newToBalanceAfterFee = toBalanceAmount + quote.quantidadeDestino;

    const operations: any[] = [];

    operations.push(
      this.prisma.balance.update({
        where: { id: fromBalance.id },
        data: { amount: newFromBalance },
      }),
    );

    if (toBalance) {
      operations.push(
        this.prisma.balance.update({
          where: { id: toBalance.id },
          data: { amount: newToBalanceAfterFee },
        }),
      );
    } else {
      operations.push(
        this.prisma.balance.create({
          data: {
            walletId: wallet.id,
            token: toToken,
            amount: newToBalanceAfterFee,
          },
        }),
      );
    }

    operations.push(
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'SWAP_OUT',
          token: fromToken,
          amount: amount,
          previousBalance: fromBalance.amount,
          newBalance: newFromBalance,
        },
      }),
    );

    operations.push(
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'SWAP_FEE',
          token: toToken,
          amount: quote.taxaCobrada,
          previousBalance: toBalanceAmount,
          newBalance: toBalanceAmount - quote.taxaCobrada,
        },
      }),
    );

    operations.push(
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'SWAP_IN',
          token: toToken,
          amount: quote.quantidadeDestino + quote.taxaCobrada,
          previousBalance: toBalanceAmount - quote.taxaCobrada,
          newBalance: newToBalanceAfterFee,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    return {
      message: 'Swap executado com sucesso!',
      resumo: quote,
    };
  }
}
