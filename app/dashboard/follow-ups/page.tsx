import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FollowUpViewContainer } from '@/components/follow-ups/follow-up-view-container';
import { type FollowUpData } from '@/types/follow-up';
import { Clock } from 'lucide-react';
import type { Prisma } from '@prisma/client';

export const metadata = {
  title: 'Follow-ups & Reminders | Pulse CRM',
};

export default async function FollowUpsPage() {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);
  const userRole = session.user.role;

  // Filter by assigned user if SALES_EXECUTIVE
  const whereClause: Prisma.FollowUpWhereInput = {};
  if (userRole === 'SALES_EXECUTIVE') {
    whereClause.assignedToId = session.user.id;
  }

  // Fetch follow-ups and sales representatives in parallel
  const [rawFollowUps, salesReps] = await Promise.all([
    prisma.followUp.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    }),
    userRole === 'ADMIN' || userRole === 'MANAGER'
      ? prisma.user.findMany({
          where: {
            role: { in: ['SALES_EXECUTIVE', 'MANAGER', 'ADMIN'] },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            role: true,
          },
          orderBy: {
            name: 'asc',
          },
        })
      : Promise.resolve([]),
  ]);

  const followUps: FollowUpData[] = rawFollowUps.map((f) => ({
    id: f.id,
    title: f.title,
    description: f.description,
    type: f.type,
    dueDate: f.dueDate.toISOString(),
    status: f.status,
    leadId: f.leadId,
    clientId: f.clientId,
    assignedToId: f.assignedToId,
    createdById: f.createdById,
    isRecurring: f.isRecurring,
    recurrencePattern: f.recurrencePattern,
    completedAt: f.completedAt ? f.completedAt.toISOString() : null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    client: f.client,
    lead: f.lead,
    assignedTo: f.assignedTo,
    createdBy: f.createdBy,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="font-medium text-gray-800">Follow-ups</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Follow-ups & Reminders
            </h1>
            <p className="text-sm text-gray-500">
              {userRole === 'SALES_EXECUTIVE'
                ? 'Manage your scheduled touchpoints, calls, and recurring tasks.'
                : 'Track, coordinate, and review upcoming follow-ups across your sales team.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main View Container */}
      <FollowUpViewContainer
        initialFollowUps={followUps}
        salesReps={salesReps}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        }}
      />
    </div>
  );
}
