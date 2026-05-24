import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async getTransactions(userId: string, page: number, limit: number) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada.');
    }

    // Matemática da paginação (Ex: Página 2 com limite 10 = Pula os 10 primeiros)
    const skip = (page - 1) * limit;

    // Busca o total de transações para o frontend saber quantas páginas existem no total
    const total = await this.prisma.transaction.count({
      where: { walletId: wallet.id },
    });

    // Busca o extrato ordenado do mais recente para o mais antigo
    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limit,
    });

    return {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: transactions,
    };
  }
}
