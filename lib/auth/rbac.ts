import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { UserRole, hasRoleAccess } from './navigation';

export * from './navigation';

/**
 * Server-side RBAC guard for page routes.
 * Redirects to /dashboard?error=access_denied if user is not authorized.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as UserRole;
  if (!hasRoleAccess(userRole, allowedRoles)) {
    redirect('/dashboard?error=access_denied');
  }

  return session;
}
