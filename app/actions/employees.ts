'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  toggleEmployeeStatusSchema,
  resetEmployeePasswordSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type ToggleEmployeeStatusInput,
  type ResetEmployeePasswordInput,
} from '@/lib/schemas/employee';
import type { PerformanceSnapshotData } from '@/types/employee';
import { logActivity } from '@/lib/activityLog';

/**
 * Ensures the acting user is an authenticated ADMIN.
 */
async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Authentication required. Please sign in.', session: null };
  }
  if (session.user.role !== 'ADMIN') {
    return { error: 'Access denied: Only administrators can manage employees.', session: null };
  }
  return { error: null, session };
}

/**
 * Generate sequential employee ID in format "EMP-0001", "EMP-0002", etc.
 */
async function generateEmployeeId(tx: Prisma.TransactionClient): Promise<string> {
  const usersWithEmpId = await tx.user.findMany({
    where: { employeeId: { startsWith: 'EMP-' } },
    select: { employeeId: true },
  });

  let maxNum = 0;
  for (const u of usersWithEmpId) {
    if (u.employeeId) {
      const match = u.employeeId.match(/EMP-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  return `EMP-${String(maxNum + 1).padStart(4, '0')}`;
}

/**
 * Helper to generate a strong, readable random temporary password.
 */
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Tmp#${randomPart}!`;
}

/**
 * Create a new employee with a temporary password and sequential ID.
 */
export async function createEmployeeAction(rawInput: CreateEmployeeInput) {
  try {
    const { error, session } = await requireAdminSession();
    if (error || !session) return { error };

    const parsed = createEmployeeSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid employee details provided.' };
    }

    const { name, email, role, department, phone, joiningDate } = parsed.data;

    // Verify email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { error: `An employee account with email "${email}" already exists.` };
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.$transaction(async (tx) => {
      const employeeId = await generateEmployeeId(tx);

      return tx.user.create({
        data: {
          employeeId,
          name,
          email,
          role,
          department: department || null,
          phone: phone || null,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          passwordHash,
          isActive: true,
        },
      });
    });

    // Fallback server console log as specified in requirements
    console.log(`\n======================================================`);
    console.log(`[EMPLOYEE CREATION] New Employee Account Created:`);
    console.log(`ID: ${user.employeeId} | Name: ${user.name} | Role: ${user.role}`);
    console.log(`Email: ${user.email}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log(`======================================================\n`);

    logActivity({
      userId: session.user.id,
      action: 'EMPLOYEE_CREATED',
      entityType: 'User',
      entityId: user.id,
      description: `Created employee ${user.name} (${user.role}) - ${user.employeeId}`,
    });

    revalidatePath('/dashboard/employees');
    revalidatePath('/dashboard');

    return {
      success: true,
      id: user.id,
      employeeId: user.employeeId,
      tempPassword,
    };
  } catch (err) {
    console.error('Failed to create employee:', err);
    return { error: 'Failed to create employee. Please check server logs.' };
  }
}

/**
 * Update an employee's profile and role.
 */
export async function updateEmployeeAction(rawInput: UpdateEmployeeInput) {
  try {
    const { error, session } = await requireAdminSession();
    if (error || !session) return { error };

    const parsed = updateEmployeeSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid employee details.' };
    }

    const { id, name, email, role, department, phone, joiningDate } = parsed.data;

    // Check if employee exists
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { error: 'Employee not found.' };
    }

    // Verify email uniqueness if email changed
    if (email !== targetUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: { email, id: { not: id } },
      });
      if (emailConflict) {
        return { error: `Email address "${email}" is already used by another account.` };
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        department: department || null,
        phone: phone || null,
        joiningDate: joiningDate ? new Date(joiningDate) : targetUser.joiningDate,
      },
    });

    if (targetUser.role !== role) {
      logActivity({
        userId: session.user.id,
        action: 'EMPLOYEE_ROLE_CHANGED',
        entityType: 'User',
        entityId: id,
        description: `Changed role of ${targetUser.name} from ${targetUser.role} to ${role}`,
      });
    } else {
      logActivity({
        userId: session.user.id,
        action: 'EMPLOYEE_UPDATED',
        entityType: 'User',
        entityId: id,
        description: `Updated employee details for ${targetUser.name}`,
      });
    }

    revalidatePath('/dashboard/employees');
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: true };
  } catch (err) {
    console.error('Failed to update employee:', err);
    return { error: 'Failed to update employee details.' };
  }
}

/**
 * Toggle an employee's active status (deactivate / reactivate).
 * Admin cannot deactivate their own account.
 */
export async function toggleEmployeeStatusAction(rawInput: ToggleEmployeeStatusInput) {
  try {
    const { error, session } = await requireAdminSession();
    if (error || !session) return { error };

    const parsed = toggleEmployeeStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: 'Invalid status request.' };
    }

    const { id, isActive } = parsed.data;

    // Prevent self-deactivation
    if (session.user.id === id && !isActive) {
      return { error: 'You cannot deactivate your own administrator account.' };
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { error: 'Employee not found.' };
    }

    await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    logActivity({
      userId: session.user.id,
      action: isActive ? 'EMPLOYEE_REACTIVATED' : 'EMPLOYEE_DEACTIVATED',
      entityType: 'User',
      entityId: id,
      description: `${isActive ? 'Reactivated' : 'Deactivated'} employee account for ${targetUser.name}`,
    });

    revalidatePath('/dashboard/employees');
    revalidatePath(`/dashboard/employees/${id}`);
    return { success: true, isActive };
  } catch (err) {
    console.error('Failed to toggle employee status:', err);
    return { error: 'Failed to update employee status.' };
  }
}

/**
 * Reset an employee's password with a new temporary password.
 */
export async function resetEmployeePasswordAction(rawInput: ResetEmployeePasswordInput) {
  try {
    const { error, session } = await requireAdminSession();
    if (error || !session) return { error };

    const parsed = resetEmployeePasswordSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: 'Invalid password reset request.' };
    }

    const { id } = parsed.data;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { error: 'Employee not found.' };
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Console logging fallback
    console.log(`\n======================================================`);
    console.log(`[PASSWORD RESET] Password Reset for Employee:`);
    console.log(`ID: ${targetUser.employeeId || 'N/A'} | Name: ${targetUser.name}`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`New Temporary Password: ${tempPassword}`);
    console.log(`======================================================\n`);

    logActivity({
      userId: session.user.id,
      action: 'EMPLOYEE_PASSWORD_RESET',
      entityType: 'User',
      entityId: id,
      description: `Reset password for employee ${targetUser.name}`,
    });

    return { success: true, tempPassword };
  } catch (err) {
    console.error('Failed to reset employee password:', err);
    return { error: 'Failed to reset password.' };
  }
}

/**
 * Fetch live performance metrics for an employee based on their role.
 */
export async function getEmployeePerformanceSnapshotAction(employeeId: string): Promise<{
  error?: string;
  data?: PerformanceSnapshotData;
}> {
  try {
    const { error } = await requireAdminSession();
    if (error) return { error };

    const user = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { role: true },
    });

    if (!user) {
      return { error: 'Employee not found.' };
    }

    // Sales metrics
    const [assignedClientsCount, activeLeadsCount, openDeals] = await Promise.all([
      prisma.client.count({ where: { assignedToId: employeeId } }),
      prisma.lead.count({
        where: {
          assignedToId: employeeId,
          status: { notIn: ['CONVERTED', 'LOST'] },
        },
      }),
      prisma.deal.findMany({
        where: {
          assignedToId: employeeId,
          stage: { notIn: ['WON', 'LOST'] },
        },
        select: { value: true },
      }),
    ]);

    const openDealsCount = openDeals.length;
    const openDealsValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0);

    // Support metrics
    const [assignedOpenTicketsCount, totalAssignedTicketsCount, resolvedTicketsCount] = await Promise.all([
      prisma.supportTicket.count({
        where: {
          assignedToId: employeeId,
          status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
        },
      }),
      prisma.supportTicket.count({ where: { assignedToId: employeeId } }),
      prisma.supportTicket.count({
        where: {
          assignedToId: employeeId,
          status: { in: ['RESOLVED', 'CLOSED'] },
        },
      }),
    ]);

    // General / created metrics
    const [createdClientsCount, createdTicketsCount] = await Promise.all([
      prisma.client.count({ where: { createdById: employeeId } }),
      prisma.supportTicket.count({ where: { createdById: employeeId } }),
    ]);

    const data: PerformanceSnapshotData = {
      role: user.role,
      assignedClientsCount,
      activeLeadsCount,
      openDealsCount,
      openDealsValue,
      assignedOpenTicketsCount,
      totalAssignedTicketsCount,
      resolvedTicketsCount,
      createdClientsCount,
      createdTicketsCount,
    };

    return { data };
  } catch (err) {
    console.error('Failed to load performance snapshot:', err);
    return { error: 'Failed to load performance metrics.' };
  }
}
