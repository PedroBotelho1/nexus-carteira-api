import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getTransactions(
    @Req() req: AuthenticatedRequest,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.userId;
    // Converte os textos da URL para números matemáticos
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return this.transactionsService.getTransactions(
      userId,
      pageNumber,
      limitNumber,
    );
  }
}
