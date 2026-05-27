import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  UnauthorizedException, // <-- Exceção importada aqui!
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { Request } from 'express';

// Atualizamos a interface para o TypeScript parar de chorar sobre o 'sub'
interface AuthenticatedRequest extends Request {
  user: {
    sub?: string;
    userId?: string;
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
    const userId = req.user.sub || req.user.userId;

    if (!userId) {
      throw new UnauthorizedException('ID do usuário não encontrado no token');
    }

    // Se o nome da função no seu service for diferente de 'getTransactions'
    // ou 'findAll', é só ajustar o nome após o ponto abaixo:
    return this.transactionsService.getTransactions(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }
}
