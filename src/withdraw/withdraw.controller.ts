import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async processWithdraw(
    @Req() req: AuthenticatedRequest,
    @Body() body: { token: string; amount: number },
  ) {
    const userId = req.user.userId;
    const { token, amount } = body;

    return this.withdrawService.processWithdraw(userId, token, amount);
  }
}
