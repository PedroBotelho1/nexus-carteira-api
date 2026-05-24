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

    // 3. Compara a palavra-passe que chegou do Postman com a palavra-passe encriptada da base de dados
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // 4. Se a palavra-passe estiver correta, prepara os dados para colocar dentro do token (a pulseira)
    const payload = { sub: user.id, email: user.email };

    // 5. Gera o Access Token (dura 15 minutos) e o Refresh Token (dura 7 dias)
    const accessToken = this.jwtService.sign(payload, {
      secret: 'minha_chave_super_secreta_access', // No mundo real, usaríamos variáveis de ambiente (.env)
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: 'minha_chave_super_secreta_refresh',
      expiresIn: '7d',
    });

    // 6. Devolve as pulseiras para o utilizador
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
