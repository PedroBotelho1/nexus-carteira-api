import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId,
      },
      include: {
        balances: true,
      },
    });

    if (!wallet) {
      throw new NotFoundException(
        'Carteira não encontrada para este utilizador.',
      );
    }

    return wallet;
  }
}
