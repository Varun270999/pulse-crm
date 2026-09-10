import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { LeadViewContainer } from '@/components/leads/lead-view-container';
import { type LeadData } from '@/types/lead';
import { UserPlus } from 'lucide-react';
import type { Prisma } from '@prisma/client';

export const metadata = {
  title: 'Leads Pipeline | Pulse CRM',
};

export default async function LeadsPage() {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);
  const userRole = session.user.role;

  // Filter by assigned user if SALES_EXECUTIVE
  const whereClause: Prisma.LeadWhereInput = {};
  if (userRole === 'SALES_EXECUTIVE') {
    whereClause.assignedToId = session.user.id;
  }

  // Fetch leads and sales representatives in parallel
  const [rawLeads, salesReps] = await Promise.all([
    prisma.lead.findMany({
      where: whereClause,
      include: {
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
        convertedClient: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
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

  const leads: LeadData[] = rawLeads.map((l) => ({
    id: l.id,
    name: l.name,
    companyName: l.companyName,
    email: l.email,
    phone: l.phone,
    source: l.source,
    status: l.status,
    estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : null,
    notes: l.notes,
    assignedToId: l.assignedToId,
    createdById: l.createdById,
    convertedClientId: l.convertedClientId,
    lostReason: l.lostReason,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
    assignedTo: l.assignedTo,
    createdBy: l.createdBy,
    convertedClient: l.convertedClient,
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
          <span className="font-medium text-gray-800">Leads</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Leads Management
            </h1>
            <p className="text-sm text-gray-500">
              {userRole === 'SALES_EXECUTIVE'
                ? 'Manage and advance prospective deals assigned to your portfolio.'
                : 'Track, qualify, and convert prospective leads across your entire sales team.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Lead Interface (Kanban Board / Table View + Filter & Actions) */}
      <LeadViewContainer
        initialLeads={leads}
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
