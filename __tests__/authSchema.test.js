const { z } = require('zod');

const authSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre es obligatorio').optional(),
  bikeModel: z.string().min(2, 'El modelo de moto es obligatorio').optional(),
});

describe('Auth Validation Schema (Zod)', () => {
  test('should validate a correct email and password', () => {
    const result = authSchema.safeParse({
      email: 'test@motociclista.com',
      password: 'securepassword123',
    });
    expect(result.success).toBe(true);
  });

  test('should fail on invalid email', () => {
    const result = authSchema.safeParse({
      email: 'correo-invalido',
      password: 'securepassword123',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('Correo electrónico inválido');
  });

  test('should fail on short password', () => {
    const result = authSchema.safeParse({
      email: 'test@motociclista.com',
      password: '123',
    });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 6 caracteres');
  });
});
