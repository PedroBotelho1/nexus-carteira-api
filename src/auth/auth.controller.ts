import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginSchema } from './dto/login.dto';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema)) // O porteiro a validar o email e a palavra-passe
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
