import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "@/lib/rate-limit"
import { env } from "@/lib/env"
import { logActivity } from "@/lib/activityLog"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Check rate limit
        const { allowed, message } = checkRateLimit(email);
        if (!allowed) {
          logActivity({
            action: 'RATE_LIMIT_EXCEEDED',
            description: `Rate limit exceeded for login attempt: ${email}`,
          });
          throw new Error(message || "Too many attempts");
        }

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user || !user.passwordHash) {
          recordFailedAttempt(email);
          logActivity({
            action: 'USER_LOGIN_FAILED',
            description: `Login failed: user not found (${email})`,
          });
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          logActivity({
            userId: user.id,
            action: 'USER_LOGIN_FAILED',
            description: `Login failed: account is deactivated (${email})`,
          });
          throw new Error("Account is inactive");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          recordFailedAttempt(email);
          logActivity({
            userId: user.id,
            action: 'USER_LOGIN_FAILED',
            description: `Login failed: invalid password for ${email}`,
          });
          throw new Error("Invalid email or password");
        }

        // On success, reset rate limit attempts
        resetAttempts(email);

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        logActivity({
          userId: user.id,
          action: 'USER_LOGIN',
          description: `User logged in successfully: ${user.name} (${user.email})`,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatarUrl = token.avatarUrl as string | null;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes session expiry
    updateAge: 5 * 60, // Refresh token every 5 minutes when active
  },
  pages: {
    signIn: "/login",
  }
});
