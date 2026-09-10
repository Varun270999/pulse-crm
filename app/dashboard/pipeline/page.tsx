import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { PipelineViewContainer } from '@/components/pipeline/pipeline-view-container';
import type { DealData, PipelineStats, PipelineStageType } from '@/types/deal';
import type { Prisma } from '@prisma/client';

export const metadata = {
  title: 'Sales Pipeline | Pulse CRM',
};

export default async function PipelinePage() {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);
  const userRole = session.user.role;

  // Filter by assigned user if SALES_EXECUTIVE
  const whereClause: Prisma.DealWhereInput = {};
  if (userRole === 'SALES_EXECUTIVE') {
    whereClause.assignedToId = session.user.id;
  }

  // Fetch deals, clients, and sales representatives in parallel
  const [rawDeals, clients, fetchedSalesReps] = await Promise.all([
    prisma.deal.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
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
        createdAt: 'desc',
      },
    }),
    prisma.client.findMany({
      where: userRole === 'SALES_EXECUTIVE' ? { assignedToId: session.user.id } : {},
      select: {
        id: true,
        companyName: true,
      },
      orderBy: {
        companyName: 'asc',
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

  const salesReps: { id: string; name: string; role: string }[] =
    userRole === 'ADMIN' || userRole === 'MANAGER'
      ? fetchedSalesReps
      : [
          {
            id: session.user.id,
            name: session.user.name || 'Current User',
            role: session.user.role || 'SALES_EXECUTIVE',
          },
        ];

  // Calculate Pipeline KPIs
  const openStages: PipelineStageType[] = ['NEW', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION'];

  let totalOpenValue = 0;
  let weightedForecast = 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  let dealsWonThisMonth = 0;
  let won90Days = 0;
  let lost90Days = 0;

  rawDeals.forEach((deal) => {
    const val = Number(deal.value);
    const prob = deal.probability;

    if (openStages.includes(deal.stage as PipelineStageType)) {
      totalOpenValue += val;
      weightedForecast += val * (prob / 100);
    }

    if (deal.stage === 'WON') {
      const wonDate = deal.wonAt || deal.updatedAt;
      if (wonDate >= startOfMonth) {
        dealsWonThisMonth += 1;
      }
      if (wonDate >= ninetyDaysAgo) {
        won90Days += 1;
      }
    } else if (deal.stage === 'LOST') {
      const lostDate = deal.lostAt || deal.updatedAt;
      if (lostDate >= ninetyDaysAgo) {
        lost90Days += 1;
      }
    }
  });

  const totalClosed90Days = won90Days + lost90Days;
  const winRate90Days =
    totalClosed90Days > 0
      ? Math.round((won90Days / totalClosed90Days) * 1000) / 10
      : 0;

  const stats: PipelineStats = {
    totalOpenValue: Math.round(totalOpenValue),
    weightedForecast: Math.round(weightedForecast),
    dealsWonThisMonth,
    winRate90Days,
  };

  // Serialize deals
  const serializedDeals: DealData[] = rawDeals.map((d) => ({
    id: d.id,
    title: d.title,
    clientId: d.clientId,
    value: Number(d.value),
    stage: d.stage as PipelineStageType,
    probability: d.probability,
    expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.toISOString() : null,
    notes: d.notes,
    lostReason: d.lostReason,
    assignedToId: d.assignedToId,
    createdById: d.createdById,
    wonAt: d.wonAt ? d.wonAt.toISOString() : null,
    lostAt: d.lostAt ? d.lostAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    client: {
      id: d.client.id,
      companyName: d.client.companyName,
      email: d.client.email,
      phone: d.client.phone,
    },
    assignedTo: {
      id: d.assignedTo.id,
      name: d.assignedTo.name,
      email: d.assignedTo.email,
      avatarUrl: d.assignedTo.avatarUrl,
    },
    createdBy: {
      id: d.createdBy.id,
      name: d.createdBy.name,
    },
  }));

  return (
    <div className="space-y-6">
      <PipelineViewContainer
        initialDeals={serializedDeals}
        stats={stats}
        clients={clients}
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
