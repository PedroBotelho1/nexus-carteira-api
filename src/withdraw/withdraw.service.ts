import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WithdrawService {
  constructor(private prisma: PrismaService) {}

  async processWithdraw(userId: string, token: string, amount: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada.');
    }

    const balance = await this.prisma.balance.findUnique({
      where: {
        walletId_token: {
          walletId: wallet.id,
          token: token,
        },
      },
    });

    if (!balance || balance.amount < amount) {
      throw new BadRequestException('Saldo insuficiente para este saque.');
    }

    const novoSaldo = balance.amount - amount;

    const result = await this.prisma.$transaction([
      this.prisma.balance.update({
        where: { id: balance.id },
        data: { amount: novoSaldo },
      }),
      this.prisma.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          token: token,
          amount: amount,
          previousBalance: balance.amount,
          newBalance: novoSaldo,
        },
      }),
    ]);

    return {
      message: 'Saque realizado com sucesso!',
      token: token,
      valorSacado: amount,
      saldoAnterior: balance.amount,
      saldoAtualizado: result[0].amount,
      transactionId: result[1].id,
    };
  }
}
