'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/schemas';
import { sendEmail } from '@/lib/services/email';
import { executeAction } from '@/lib/actionWrapper';

export async function loginAction(formData: FormData, callbackUrl: string) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: callbackUrl || '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password' };
        case 'CallbackRouteError':
          return { error: error.cause?.err?.message || 'Invalid email or password' };
        default:
          return { error: 'Something went wrong.' };
      }
    }
    throw error;
  }
}

export async function forgotPasswordAction(formData: FormData) {
  return executeAction('forgotPasswordAction', async () => {
    const email = formData.get('email') as string;
    const validatedFields = forgotPasswordSchema.safeParse({ email });

    if (!validatedFields.success) {
      return { error: 'Invalid email' };
    }

    const user = await prisma.user.findUnique({
      where: { email: validatedFields.data.email },
    });

    if (user) {
      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${token}`;

      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password - Pulse CRM',
        body: `Hello ${user.name},\n\nWe received a request to reset your Pulse CRM account password.\nClick the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\nIf you did not request this, you can safely ignore this email.`,
      });
    }

    // Always return success to prevent email enumeration
    return { success: 'If an account with that email exists, we sent a password reset link.' };
  });
}

export async function resetPasswordAction(formData: FormData, token: string) {
  return executeAction('resetPasswordAction', async () => {
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    const validatedFields = resetPasswordSchema.safeParse({ password, confirmPassword });

    if (!validatedFields.success) {
      return { error: 'Invalid password format' };
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return { error: 'Invalid or expired token' };
    }

    const passwordHash = await bcrypt.hash(validatedFields.data.password, 10);

    // Update password and delete all reset tokens for the user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return { success: 'Password has been reset successfully. You can now log in.' };
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
