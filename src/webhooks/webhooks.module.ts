import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <-- Importe aqui

@Module({
  imports: [PrismaModule], // <-- Coloque dentro do array de imports
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
