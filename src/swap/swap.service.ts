import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const COINGECKO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BRL: 'brl',
};

// Explicamos para o TypeScript exatamente o que a CoinGecko vai devolver
type CoinGeckoResponse = Record<string, Record<string, number>>;

@Injectable()
export class SwapService {
  constructor(private prisma: PrismaService) {}

  private async fetchExchangeRate(
    fromToken: string,
    toToken: string,
  ): Promise<number> {
    const fromId = COINGECKO_MAP[fromToken.toUpperCase()];
    const toId = COINGECKO_MAP[toToken.toUpperCase()];

    if (!fromId || !toId) {
      throw new BadRequestException('Moeda não suportada.');
    }

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${fromId}&vs_currencies=${toId}`;
      const response = await fetch(url);
      const data = (await response.json()) as CoinGeckoResponse;

      if (data[fromId] && data[fromId][toId]) {
        return data[fromId][toId];
      }

      const urlRev = `https://api.coingecko.com/api/v3/simple/price?ids=${toId}&vs_currencies=${fromId}`;
      const responseRev = await fetch(urlRev);
      const dataRev = (await responseRev.json()) as CoinGeckoResponse;

      if (dataRev[toId] && dataRev[toId][fromId]) {
        return 1 / dataRev[toId][fromId];
      }

      throw new Error('Cotação não encontrada na API.');
    } catch {
      // PLANO DE EMERGÊNCIA
      const rates: Record<string, number> = {
        'BTC-BRL': 350000,
        'ETH-BRL': 18000,
        'USDT-BRL': 5.5,
      };

      const direct =
        rates[`${fromToken.toUpperCase()}-${toToken.toUpperCase()}`];
      if (direct) return direct;

      const rev = rates[`${toToken.toUpperCase()}-${fromToken.toUpperCase()}`];
      if (rev) return 1 / rev;

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
