import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export class CreateUserDto {
  email!: string;
  password!: string;
}
