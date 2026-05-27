import { Controller, Post, Body } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('deposit')
  async processDeposit(
    @Body()
    body: {
      userId: string;
      token: string;
      amount: number;
      idempotencyKey: string;
    },
  ) {
    const { userId, token, amount, idempotencyKey } = body;

    // Repassa para o Service fazer a lógica pesada
    return this.webhooksService.processDeposit(
      userId,
      token,
      amount,
      idempotencyKey,
    );
  }
}
