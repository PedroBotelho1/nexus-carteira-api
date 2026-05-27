import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
// ❌ Removemos a importação do JwtStrategy que eu tinha mandado

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'nexus-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService], // ❌ Removemos ele daqui também
  exports: [JwtModule], // ✅ Apenas mantemos a linha que exporta a maquininha!
})
export class AuthModule {}
