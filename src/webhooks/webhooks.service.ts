import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async processDeposit(
    userId: string,
    token: string,
    amount: number,
    idempotencyKey: string,
  ) {
    // Trava de Segurança: Esse depósito já foi processado antes?
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      throw new ConflictException('Depósito já processado anteriormente.');
    }

    // Verifica se a carteira do usuário existe
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Usuário ou carteira não encontrados.');
    }

    // O token existe na carteira deste usuário?
    const balance = await this.prisma.balance.findUnique({
      where: {
        walletId_token: {
          walletId: wallet.id,
          token: token,
        },
      },
    });

    if (!balance) {
      throw new NotFoundException(
        `Token ${token} não suportado ou inexistente.`,
      );
    }

    const novoSaldo = balance.amount + amount;

    const result = await this.prisma.$transaction([
      this.prisma.balance.update({
        where: { id: balance.id },
        data: { amount: novoSaldo },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          token: token,
          amount: amount,
          previousBalance: balance.amount,
          newBalance: novoSaldo,
          idempotencyKey: idempotencyKey,
        },
      }),
    ]);

    return {
      message: 'Depósito realizado com sucesso!',
      token: token,
      saldoAnterior: balance.amount,
      saldoAtualizado: result[0].amount,
      transactionId: result[1].id,
    };
  }
}
