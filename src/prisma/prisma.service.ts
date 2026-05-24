import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Isso faz o NestJS conectar no PostgreSQL assim que o servidor ligar
    await this.$connect();
  }
}
