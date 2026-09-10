import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string({ message: 'Password is required' })
    .min(1, { message: 'Password is required' }),
});

export const passwordSchema = z
  .string({ message: 'Password is required' })
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' });

export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string({ message: 'Please confirm your password' })
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: 'Current password is required' })
      .min(1, { message: 'Current password is required' }),
    newPassword: passwordSchema,
    confirmNewPassword: z
      .string({ message: 'Please confirm your new password' })
      .min(1, { message: 'Please confirm your new password' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateEmailSchema = z.object({
  newEmail: z
    .string({ message: 'Email is required' })
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  currentPassword: z
    .string({ message: 'Current password is required' })
    .min(1, { message: 'Current password is required' }),
});

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
