import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getWallet(@Req() request: AuthenticatedRequest) {
    const userId = request.user.sub;

    return this.walletService.getWallet(userId);
  }
}
