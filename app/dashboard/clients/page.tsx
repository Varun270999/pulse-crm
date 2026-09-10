import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { ClientListTable, type ClientRowData } from '@/components/clients/client-list-table';
import { Users, Plus, CheckCircle2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export const metadata = {
  title: 'Client Directory | Pulse CRM',
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: { success?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userRole = session.user.role;
  const canAddClient = userRole !== 'SUPPORT_AGENT';

  // Role-based where clause
  const whereClause: Prisma.ClientWhereInput = {};
  if (userRole === 'SALES_EXECUTIVE') {
    whereClause.assignedToId = session.user.id;
  }

  // Fetch clients and sales representatives in parallel
  const [rawClients, salesReps] = await Promise.all([
    prisma.client.findMany({
      where: whereClause,
      include: {
        contacts: {
          select: {
            id: true,
            name: true,
            designation: true,
            email: true,
            phone: true,
            isPrimary: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            role: true,
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

  const clients: ClientRowData[] = rawClients.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    industry: c.industry,
    status: c.status,
    source: c.source,
    assignedToId: c.assignedToId,
    assignedTo: c.assignedTo,
    contacts: c.contacts,
    createdAt: c.createdAt.toISOString(),
  }));

  const showSuccessBanner = searchParams?.success === 'created';

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Success Notification Banner */}
      {showSuccessBanner && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold">Client Registered Successfully!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              The company profile and primary contact have been added to your CRM directory.
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-800">Clients</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Users className="h-5 w-5" />
            </div>
            Client Directory
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {userRole === 'SALES_EXECUTIVE'
              ? 'Showing clients assigned to your portfolio.'
              : `${clients.length} ${clients.length === 1 ? 'registered client' : 'registered clients'} in your database.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!canAddClient ? (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
              <Eye className="h-3.5 w-3.5" />
              Read-Only Access
            </div>
          ) : (
            <Link
              href="/dashboard/clients/new"
              className={cn(buttonVariants({ variant: 'default' }), 'inline-flex items-center gap-1.5')}
            >
              <Plus className="h-4 w-4" />
              Add Client
            </Link>
          )}
        </div>
      </div>

      {/* Interactive Table with Search, Filter, Sort, Pagination, and Row Actions */}
      <ClientListTable
        initialClients={clients}
        salesReps={salesReps}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          role: userRole,
        }}
      />
    </div>
  );
}
