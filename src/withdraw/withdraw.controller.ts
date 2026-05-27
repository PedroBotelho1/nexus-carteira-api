import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { WithdrawService } from './withdraw.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub?: string;
    userId?: string;
    email: string;
  };
}

@Controller('withdraw')
export class WithdrawController {
  constructor(private readonly withdrawService: WithdrawService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async executeWithdraw(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      token: string;
      amount: number;
    },
  ) {
    const userId = req.user.sub || req.user.userId;

    if (!userId) {
      throw new UnauthorizedException('ID do usuário não encontrado no token');
    }

    return this.withdrawService.processWithdraw(
      userId,
      body.token,
      body.amount,
    );
  }
}
