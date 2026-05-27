import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SwapModule } from './swap/swap.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL,
          ttl: 60000, // Tempo de expiração em milissegundos (60 segundos)
        }),
      }),
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    WalletModule,
    WebhooksModule,
    WithdrawModule,
    TransactionsModule,
    SwapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
