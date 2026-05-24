import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WithdrawModule } from './withdraw/withdraw.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, WalletModule, WebhooksModule, WithdrawModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
