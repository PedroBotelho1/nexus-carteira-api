import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Vai à base de dados procurar o utilizador pelo email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    // 2. Se o utilizador não existir, expulsa com Erro 401
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 3. Compara a palavra-passe que chegou do Postman com a palavra-passe encriptada na base de dados
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 4. Prepara os dados para colocar dentro do token
    const payload = { sub: user.id, email: user.email };

    // 5. Gera o Access Token (15 minutos) e o Refresh Token (7 dias)
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'nexus-secret-key',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'nexus-refresh-secret-key',
      expiresIn: '7d',
    });

    // 6. Devolve os tokens para o utilizador
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
