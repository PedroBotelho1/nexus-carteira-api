import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config'; // Garante que a variável DATABASE_URL seja lida do .env

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Cria o adaptador para o PostgreSQL (Obrigatório no Prisma 7+)
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });

    // 2. Passa o adaptador para o PrismaClient iniciar
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
