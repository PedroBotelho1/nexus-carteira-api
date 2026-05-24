import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <-- ESSA É A LINHA MÁGICA QUE FALTAVA
})
export class PrismaModule {}
