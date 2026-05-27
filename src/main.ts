import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
}
bootstrap().catch((err) => {
  console.error('Falha ao iniciar o servidor NestJS:', err);
});
