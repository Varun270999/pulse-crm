'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/lib/auth/rbac';
import type {
  DateRangeFilter,
  ReportsData,
  MonthlyRevenuePoint,
  MonthlyWonLostPoint,
  StageDistributionPoint,
  FunnelStepPoint,
  LeadSourcePoint,
  SalesRepLeaderboardItem,
  SupportAgentMetricItem,
  TopClientRevenueItem,
} from '@/types/reports';

/**
 * Helper to compute start and end dates based on selected range filter.
 */
function getDateRangeBounds(filter: DateRangeFilter): {
  startDate: Date;
  endDate: Date;
  rangeLabel: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (filter.type) {
    case 'LAST_MONTH': {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const startDate = new Date(prevYear, prevMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999);
      const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { startDate, endDate, rangeLabel: `Last Month (${monthName})` };
    }
    case 'THIS_QUARTER': {
      const quarterIndex = Math.floor(month / 3);
      const startQuarterMonth = quarterIndex * 3;
      const startDate = new Date(year, startQuarterMonth, 1, 0, 0, 0, 0);
      const endDate = new Date(year, startQuarterMonth + 3, 0, 23, 59, 59, 999);
      return { startDate, endDate, rangeLabel: `This Quarter (Q${quarterIndex + 1} ${year})` };
    }
    case 'THIS_YEAR': {
      const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      return { startDate, endDate, rangeLabel: `This Year (${year})` };
    }
    case 'CUSTOM': {
      if (filter.from && filter.to) {
        const startDate = new Date(`${filter.from}T00:00:00.000`);
        const endDate = new Date(`${filter.to}T23:59:59.999`);
        return {
          startDate,
          endDate,
          rangeLabel: `Custom (${filter.from} to ${filter.to})`,
        };
      }
      // Fall through to THIS_MONTH if incomplete
    }
    case 'THIS_MONTH':
    default: {
      const startDate = new Date(year, month, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { startDate, endDate, rangeLabel: `This Month (${monthName})` };
    }
  }
}

/**
 * Generates last 6 calendar months metadata (start, end, label).
 */
function getLast6Months(): { start: Date; end: Date; label: string }[] {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months.push({ start, end, label });
  }

  return months;
}

/**
 * Fetch complete Reports & Analytics data based on user role and date range filter.
 */
export async function getReportsDataAction(
  filter: DateRangeFilter = { type: 'THIS_MONTH' }
): Promise<{ error?: string; data?: ReportsData }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Authentication required. Please sign in.' };
    }

    const userRole = session.user.role as UserRole;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot view analytical reports.' };
    }

    const { startDate, endDate, rangeLabel } = getDateRangeBounds(filter);
    const isSalesExec = userRole === 'SALES_EXECUTIVE';
    const currentUserId = session.user.id;

    // --- SALES EXECUTIVE "MY PERFORMANCE" VIEW ---
    if (isSalesExec) {
      const [
        myLeads,
        myConvertedLeads,
        myWonDeals,
        myAllDeals,
        myClients,
      ] = await Promise.all([
        prisma.lead.count({
          where: {
            assignedToId: currentUserId,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.lead.count({
          where: {
            assignedToId: currentUserId,
            status: 'CONVERTED',
            updatedAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.deal.findMany({
          where: {
            assignedToId: currentUserId,
            stage: 'WON',
            wonAt: { gte: startDate, lte: endDate },
          },
          select: { value: true },
        }),
        prisma.deal.findMany({
          where: { assignedToId: currentUserId },
          select: { stage: true, value: true },
        }),
        prisma.client.findMany({
          where: { assignedToId: currentUserId },
          select: { id: true },
        }),
      ]);

      const myClientIds = myClients.map((c) => c.id);

      // Revenue contribution in date range
      const myPayments = await prisma.payment.findMany({
        where: {
          clientId: { in: myClientIds },
          paymentDate: { gte: startDate, lte: endDate },
        },
        select: { amount: true },
      });

      const dealsWonCount = myWonDeals.length;
      const dealsWonValue = myWonDeals.reduce((sum, d) => sum + Number(d.value), 0);
      const revenueContribution = myPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Stage distribution
      const stageMap: Record<string, { count: number; value: number }> = {
        NEW: { count: 0, value: 0 },
        QUALIFICATION: { count: 0, value: 0 },
        PROPOSAL: { count: 0, value: 0 },
        NEGOTIATION: { count: 0, value: 0 },
        WON: { count: 0, value: 0 },
        LOST: { count: 0, value: 0 },
      };

      const stageLabels: Record<string, string> = {
        NEW: 'New',
        QUALIFICATION: 'Qualification',
        PROPOSAL: 'Proposal',
        NEGOTIATION: 'Negotiation',
        WON: 'Won',
        LOST: 'Lost',
      };

      for (const d of myAllDeals) {
        if (stageMap[d.stage]) {
          stageMap[d.stage].count++;
          stageMap[d.stage].value += Number(d.value);
        }
      }

      const dealsByStage = Object.entries(stageMap).map(([stg, val]) => ({
        stage: stg,
        label: stageLabels[stg] || stg,
        count: val.count,
        value: val.value,
      }));

      const reportsData: ReportsData = {
        userRole,
        dateRange: filter,
        rangeLabel,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        myPerformance: {
          totalLeads: myLeads,
          convertedLeads: myConvertedLeads,
          dealsWonCount,
          dealsWonValue,
          revenueContribution,
          dealsByStage,
        },
      };

      return { data: reportsData };
    }

    // --- ADMIN / MANAGER COMPANY-WIDE REPORTING ---
    const last6Months = getLast6Months();

    // 1. Monthly Revenue Trend (Last 6 months)
    const revenueTrend: MonthlyRevenuePoint[] = [];
    for (const m of last6Months) {
      const payments = await prisma.payment.findMany({
        where: { paymentDate: { gte: m.start, lte: m.end } },
        select: { amount: true },
      });
      const monthRev = payments.reduce((acc, p) => acc + Number(p.amount), 0);
      revenueTrend.push({ month: m.label, revenue: monthRev });
    }

    // 2. Deals Won vs Lost per Month (Last 6 months)
    const wonVsLostTrend: MonthlyWonLostPoint[] = [];
    for (const m of last6Months) {
      const [wonCount, lostCount] = await Promise.all([
        prisma.deal.count({
          where: { stage: 'WON', wonAt: { gte: m.start, lte: m.end } },
        }),
        prisma.deal.count({
          where: { stage: 'LOST', lostAt: { gte: m.start, lte: m.end } },
        }),
      ]);
      wonVsLostTrend.push({ month: m.label, won: wonCount, lost: lostCount });
    }

    // 3. Current Pipeline Stage Distribution (all active deals)
    const allActiveDeals = await prisma.deal.findMany({
      select: { stage: true, value: true },
    });

    const stageMap: Record<string, { count: number; value: number }> = {
      NEW: { count: 0, value: 0 },
      QUALIFICATION: { count: 0, value: 0 },
      PROPOSAL: { count: 0, value: 0 },
      NEGOTIATION: { count: 0, value: 0 },
      WON: { count: 0, value: 0 },
      LOST: { count: 0, value: 0 },
    };

    const stageLabels: Record<string, string> = {
      NEW: 'New Lead',
      QUALIFICATION: 'Qualification',
      PROPOSAL: 'Proposal',
      NEGOTIATION: 'Negotiation',
      WON: 'Won',
      LOST: 'Lost',
    };

    for (const d of allActiveDeals) {
      if (stageMap[d.stage]) {
        stageMap[d.stage].count++;
        stageMap[d.stage].value += Number(d.value);
      }
    }

    const stageDistribution: StageDistributionPoint[] = Object.entries(stageMap).map(
      ([stg, data]) => ({
        stage: stg,
        label: stageLabels[stg] || stg,
        count: data.count,
        value: data.value,
      })
    );

    // 4. Sales Overview Stat Tiles (in selected date range)
    const [rangePayments, rangeWonDeals, rangeLostDeals] = await Promise.all([
      prisma.payment.findMany({
        where: { paymentDate: { gte: startDate, lte: endDate } },
        select: { amount: true },
      }),
      prisma.deal.findMany({
        where: { stage: 'WON', wonAt: { gte: startDate, lte: endDate } },
        select: { value: true },
      }),
      prisma.deal.count({
        where: { stage: 'LOST', lostAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    const totalRevenue = rangePayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const dealsWon = rangeWonDeals.length;
    const avgDealSize =
      dealsWon > 0
        ? Math.round(rangeWonDeals.reduce((acc, d) => acc + Number(d.value), 0) / dealsWon)
        : 0;
    const totalFinishedDeals = dealsWon + rangeLostDeals;
    const winRate =
      totalFinishedDeals > 0 ? Math.round((dealsWon / totalFinishedDeals) * 100) : 0;

    // 5. Leads & Conversion Tab
    const [rangeLeads, allLeadsForFunnel] = await Promise.all([
      prisma.lead.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.lead.findMany({
        select: {
          id: true,
          status: true,
          source: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const targetLeads = rangeLeads.length > 0 ? rangeLeads : allLeadsForFunnel;
    const totalLeads = rangeLeads.length;

    // Cumulative Funnel Calculation
    const countNew = targetLeads.length;
    const countContacted = targetLeads.filter((l) =>
      ['CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'CONVERTED'].includes(l.status)
    ).length;
    const countQualified = targetLeads.filter((l) =>
      ['QUALIFIED', 'PROPOSAL_SENT', 'CONVERTED'].includes(l.status)
    ).length;
    const countProposal = targetLeads.filter((l) =>
      ['PROPOSAL_SENT', 'CONVERTED'].includes(l.status)
    ).length;
    const countConverted = targetLeads.filter((l) => l.status === 'CONVERTED').length;

    const baseCount = countNew || 1;
    const funnelSteps: FunnelStepPoint[] = [
      {
        stage: 'NEW',
        label: 'New Leads',
        count: countNew,
        conversionRateFromPrev: 100,
        conversionRateFromTotal: 100,
      },
      {
        stage: 'CONTACTED',
        label: 'Contacted',
        count: countContacted,
        conversionRateFromPrev: countNew > 0 ? Math.round((countContacted / countNew) * 100) : 0,
        conversionRateFromTotal: Math.round((countContacted / baseCount) * 100),
      },
      {
        stage: 'QUALIFIED',
        label: 'Qualified',
        count: countQualified,
        conversionRateFromPrev: countContacted > 0 ? Math.round((countQualified / countContacted) * 100) : 0,
        conversionRateFromTotal: Math.round((countQualified / baseCount) * 100),
      },
      {
        stage: 'PROPOSAL_SENT',
        label: 'Proposal Sent',
        count: countProposal,
        conversionRateFromPrev: countQualified > 0 ? Math.round((countProposal / countQualified) * 100) : 0,
        conversionRateFromTotal: Math.round((countProposal / baseCount) * 100),
      },
      {
        stage: 'CONVERTED',
        label: 'Converted',
        count: countConverted,
        conversionRateFromPrev: countProposal > 0 ? Math.round((countConverted / countProposal) * 100) : 0,
        conversionRateFromTotal: Math.round((countConverted / baseCount) * 100),
      },
    ];

    // Leads by Source
    const sourceCounts: Record<string, number> = {};
    for (const l of targetLeads) {
      sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
    }

    const sourceLabels: Record<string, string> = {
      WEBSITE: 'Website',
      REFERRAL: 'Referral',
      COLD_CALL: 'Cold Call',
      SOCIAL_MEDIA: 'Social Media',
      EVENT: 'Event',
      OTHER: 'Other',
    };

    const leadsBySource: LeadSourcePoint[] = Object.entries(sourceCounts).map(([src, cnt]) => ({
      source: src,
      label: sourceLabels[src] || src,
      count: cnt,
      percentage: Math.round((cnt / (targetLeads.length || 1)) * 100),
    }));

    // Average time to conversion in days
    const convertedLeads = targetLeads.filter((l) => l.status === 'CONVERTED');
    let totalConversionDays = 0;
    for (const cl of convertedLeads) {
      const diffMs = cl.updatedAt.getTime() - cl.createdAt.getTime();
      const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
      totalConversionDays += diffDays;
    }
    const avgTimeToConversionDays =
      convertedLeads.length > 0
        ? Number((totalConversionDays / convertedLeads.length).toFixed(1))
        : 0;

    const conversionRate =
      targetLeads.length > 0
        ? Math.round((countConverted / targetLeads.length) * 100)
        : 0;

    // 6. Employee Performance Tab
    const [salesReps, supportAgents] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: ['SALES_EXECUTIVE', 'MANAGER', 'ADMIN'] }, isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { role: { in: ['SUPPORT_AGENT', 'MANAGER', 'ADMIN'] }, isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Sales Reps Leaderboard
    const salesLeaderboard: SalesRepLeaderboardItem[] = [];
    for (const rep of salesReps) {
      const [leadsAssigned, repDealsWon, repClients] = await Promise.all([
        prisma.lead.count({
          where: { assignedToId: rep.id, createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.deal.count({
          where: { assignedToId: rep.id, stage: 'WON', wonAt: { gte: startDate, lte: endDate } },
        }),
        prisma.client.findMany({
          where: { assignedToId: rep.id },
          select: { id: true },
        }),
      ]);

      const clientIds = repClients.map((c) => c.id);
      const payments = await prisma.payment.findMany({
        where: {
          clientId: { in: clientIds },
          paymentDate: { gte: startDate, lte: endDate },
        },
        select: { amount: true },
      });

      const revenueGenerated = payments.reduce((acc, p) => acc + Number(p.amount), 0);

      salesLeaderboard.push({
        id: rep.id,
        name: rep.name,
        email: rep.email,
        leadsAssigned,
        dealsWon: repDealsWon,
        revenueGenerated,
      });
    }

    // Sort leaderboard by revenue descending
    salesLeaderboard.sort((a, b) => b.revenueGenerated - a.revenueGenerated);

    const revenuePerRepChart = salesLeaderboard
      .filter((r) => r.revenueGenerated > 0 || r.dealsWon > 0)
      .slice(0, 10)
      .map((r) => ({
        name: r.name.split(' ')[0], // First name for chart readability
        revenue: r.revenueGenerated,
      }));

    // Support Agents Metrics
    const supportAgentMetrics: SupportAgentMetricItem[] = [];
    for (const agent of supportAgents) {
      const resolvedTickets = await prisma.supportTicket.findMany({
        where: {
          assignedToId: agent.id,
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true, resolvedAt: true },
      });

      let totalResolutionHours = 0;
      for (const t of resolvedTickets) {
        if (t.resolvedAt) {
          const diffMs = t.resolvedAt.getTime() - t.createdAt.getTime();
          totalResolutionHours += Math.max(0, diffMs / (1000 * 60 * 60));
        }
      }

      const avgHours =
        resolvedTickets.length > 0
          ? Number((totalResolutionHours / resolvedTickets.length).toFixed(1))
          : 0;

      supportAgentMetrics.push({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        ticketsResolved: resolvedTickets.length,
        avgResolutionHours: avgHours,
      });
    }

    supportAgentMetrics.sort((a, b) => b.ticketsResolved - a.ticketsResolved);

    // 7. Client & Revenue Tab
    const [totalActiveClients, newClientsCount, unpaidInvoices, allPaymentsWithClient] =
      await Promise.all([
        prisma.client.count({ where: { status: 'ACTIVE' } }),
        prisma.client.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
        prisma.invoice.findMany({
          where: { status: { notIn: ['PAID', 'CANCELLED', 'DRAFT'] } },
          select: { totalAmount: true, paidAmount: true },
        }),
        prisma.payment.findMany({
          include: {
            client: { select: { id: true, companyName: true } },
          },
        }),
      ]);

    const totalOutstanding = unpaidInvoices.reduce(
      (acc, inv) => acc + Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount)),
      0
    );

    // Group payments by client
    const clientRevenueMap: Record<
      string,
      { companyName: string; totalRevenue: number; invoiceIds: Set<string> }
    > = {};

    for (const p of allPaymentsWithClient) {
      if (!p.client) continue;
      if (!clientRevenueMap[p.clientId]) {
        clientRevenueMap[p.clientId] = {
          companyName: p.client.companyName,
          totalRevenue: 0,
          invoiceIds: new Set<string>(),
        };
      }
      clientRevenueMap[p.clientId].totalRevenue += Number(p.amount);
      if (p.invoiceId) {
        clientRevenueMap[p.clientId].invoiceIds.add(p.invoiceId);
      }
    }

    const topClients: TopClientRevenueItem[] = Object.entries(clientRevenueMap)
      .map(([id, data]) => ({
        id,
        companyName: data.companyName,
        totalRevenue: data.totalRevenue,
        invoiceCount: data.invoiceIds.size,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const reportsData: ReportsData = {
      userRole,
      dateRange: filter,
      rangeLabel,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      salesOverview: {
        revenueTrend,
        wonVsLostTrend,
        stageDistribution,
        totalRevenue,
        dealsWon,
        avgDealSize,
        winRate,
      },
      leadsConversion: {
        funnelSteps,
        leadsBySource,
        totalLeads,
        conversionRate,
        avgTimeToConversionDays,
      },
      employeePerformance: {
        salesLeaderboard,
        revenuePerRepChart,
        supportAgentMetrics,
      },
      clientRevenue: {
        totalActiveClients,
        newClientsCount,
        totalOutstanding,
        topClients,
      },
    };

    return { data: reportsData };
  } catch (err) {
    console.error('Failed to generate reports data:', err);
    return { error: 'Failed to generate analytics data.' };
  }
}
