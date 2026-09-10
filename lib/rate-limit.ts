type RateLimitInfo = {
  attempts: number;
  lockedUntil: number | null;
};

// Simple in-memory store for rate limiting login attempts.
// Note: This will reset on server restart and doesn't work well in multi-instance deployments.
const loginAttempts = new Map<string, RateLimitInfo>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 5 * 60 * 1000; // 5 minutes

export function checkRateLimit(email: string): { allowed: boolean; message?: string } {
  const normalizedEmail = email.toLowerCase();
  const info = loginAttempts.get(normalizedEmail) || { attempts: 0, lockedUntil: null };

  if (info.lockedUntil && info.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((info.lockedUntil - Date.now()) / 60000);
    return { allowed: false, message: `Too many attempts. Please try again in ${minutesLeft} minutes.` };
  }

  // If lock has expired, reset
  if (info.lockedUntil && info.lockedUntil <= Date.now()) {
    loginAttempts.set(normalizedEmail, { attempts: 0, lockedUntil: null });
  }

  return { allowed: true };
}

export function recordFailedAttempt(email: string) {
  const normalizedEmail = email.toLowerCase();
  const info = loginAttempts.get(normalizedEmail) || { attempts: 0, lockedUntil: null };
  
  info.attempts += 1;
  if (info.attempts >= MAX_ATTEMPTS) {
    info.lockedUntil = Date.now() + LOCKOUT_TIME_MS;
  }
  
  loginAttempts.set(normalizedEmail, info);
}

export function resetAttempts(email: string) {
  loginAttempts.delete(email.toLowerCase());
}
