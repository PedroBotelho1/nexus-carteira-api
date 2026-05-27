import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  UnauthorizedException, // <-- Importado aqui bonitinho!
} from '@nestjs/common';
import { SwapService } from './swap.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub?: string;
    userId?: string;
    email: string;
  };
}

@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Get('quote')
  async getQuote(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('amount') amount: string,
  ) {
    return this.swapService.getQuoteDetails(from, to, parseFloat(amount));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async executeSwap(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      from: string;
      to: string;
      amount: number;
    },
  ) {
    const userId = req.user.sub || req.user.userId;

    if (!userId) {
      throw new UnauthorizedException('ID do usuário não encontrado no token');
    }

    return this.swapService.executeSwap(
      userId,
      body.from,
      body.to,
      body.amount,
    );
  }
}
