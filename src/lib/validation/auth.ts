import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.string().email()
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas nao conferem.",
    path: ["confirmPassword"]
  });

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
