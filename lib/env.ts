import { z } from 'zod';

const envSchema = z.object({
  // Required core variables
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required and cannot be empty'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required for session security'),
  NEXTAUTH_URL: z
    .string()
    .min(1, 'NEXTAUTH_URL is required')
    .default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional third-party integration variables
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z
    .string()
    .optional()
    .default('Pulse CRM <noreply@pulsecrm.local>'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formattedErrors = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  console.error('\n❌ CRITICAL STARTUP ERROR: Missing or invalid environment variables:\n' + formattedErrors + '\n');
  throw new Error(
    `Missing or invalid environment configuration:\n${formattedErrors}\n\nPlease review your .env file against .env.example.`
  );
}

export const env = parsed.data;
