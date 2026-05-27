import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // Tem que ter essa linha

@Module({
  imports: [PrismaModule, AuthModule], // Tem que ter o AuthModule aqui dentro!
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}
