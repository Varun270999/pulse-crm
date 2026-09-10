import { Suspense } from 'react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { AccessDeniedAlert } from '@/components/dashboard/access-denied-alert';
import {
  Users,
  UserPlus,
  TrendingUp,
  Receipt,
  LifeBuoy,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  PlusCircle,
  FileText,
  Clock,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import { UpcomingFollowUpsWidget } from '@/components/dashboard/upcoming-follow-ups-widget';
import type { FollowUpData } from '@/types/follow-up';
import { formatINR } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || 'User';

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Execute all dashboard overview queries concurrently
  const [
    totalUsersCount,
    totalClientsCount,
    activeLeadsCount,
    openDeals,
    pendingInvoices,
    monthPayments,
    openSupportTicketsCount,
    urgentTicketsCount,
    rawUpcomingFollowUps,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.lead.count({
      where: {
        status: {
          notIn: ['CONVERTED', 'LOST'],
        },
      },
    }),
    prisma.deal.findMany({
      where: {
        stage: {
          in: ['NEW', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION'],
        },
      },
      select: {
        value: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        status: {
          in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        amount: true,
      },
    }),
    prisma.supportTicket.count({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS'],
        },
      },
    }),
    prisma.supportTicket.count({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        priority: { in: ['HIGH', 'URGENT'] },
      },
    }),
    session?.user?.id
      ? prisma.followUp.findMany({
          where: {
            assignedToId: session.user.id,
            status: 'PENDING',
          },
          include: {
            client: { select: { id: true, companyName: true } },
            lead: { select: { id: true, name: true, companyName: true } },
            assignedTo: { select: { id: true, name: true, role: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const openDealsCount = openDeals.length;
  const openDealsTotalVal = openDeals.reduce((sum, d) => sum + Number(d.value), 0);
  const openDealsValue = formatINR(openDealsTotalVal);

  const pendingInvoicesCount = pendingInvoices.length;
  const pendingInvoicesTotalVal = pendingInvoices.reduce(
    (sum, inv) => sum + Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount)),
    0
  );
  const pendingInvoicesValue = formatINR(pendingInvoicesTotalVal);

  const revenueCollectedThisMonthVal = monthPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const revenueCollectedThisMonthFormatted = formatINR(revenueCollectedThisMonthVal);

  const upcomingFollowUps: FollowUpData[] = rawUpcomingFollowUps.map((f) => ({
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

  // Formatted current date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const statCards = [
    {
      title: 'Total Clients',
      value: totalClientsCount.toString(),
      subtext: totalClientsCount === 1 ? '1 registered account' : `${totalClientsCount} registered accounts`,
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/clients',
    },
    {
      title: 'Active Leads',
      value: activeLeadsCount.toString(),
      subtext: activeLeadsCount === 1 ? '1 active pipeline deal' : `${activeLeadsCount} active pipeline deals`,
      trend: 'up',
      icon: UserPlus,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/dashboard/leads',
    },
    {
      title: 'Open Deals (Pipeline)',
      value: openDealsCount.toString(),
      subtext: `${openDealsValue} pipeline value`,
      trend: 'neutral',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/dashboard/pipeline',
    },
    {
      title: 'Pending Invoices',
      value: pendingInvoicesCount.toString(),
      subtext: `${pendingInvoicesValue} outstanding`,
      trend: 'warning',
      icon: Receipt,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      href: '/dashboard/invoices',
    },
    {
      title: 'Revenue Collected',
      value: revenueCollectedThisMonthFormatted,
      subtext: 'This month across receipts',
      trend: 'up',
      icon: CreditCard,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/dashboard/payments',
    },
    {
      title: 'Open Support Tickets',
      value: openSupportTicketsCount.toString(),
      subtext:
        urgentTicketsCount > 0
          ? `${urgentTicketsCount} marked high/urgent`
          : 'All SLAs on track',
      trend: urgentTicketsCount > 0 ? 'attention' : 'neutral',
      icon: LifeBuoy,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      href: '/dashboard/tickets',
    },
    {
      title: 'Team Members',
      value: totalUsersCount.toString(),
      subtext: 'Active database users',
      trend: 'neutral',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/dashboard/employees',
    },
  ];

  return (
    <div className="space-y-8">
      {/* RBAC Access Denied Warning (Shown if user redirected with ?error=access_denied) */}
      <Suspense fallback={null}>
        <AccessDeniedAlert />
      </Suspense>

      {/* Greeting & Header Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-medium text-blue-600">
              <Activity className="h-3.5 w-3.5" /> Pulse CRM Live
            </span>
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/leads/new"
            className={buttonVariants({ variant: 'default', size: 'sm' })}
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Add Lead
          </Link>
          <Link
            href="/dashboard/pipeline/new"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <TrendingUp className="mr-1.5 h-4 w-4 text-indigo-600" />
            New Deal
          </Link>
          <Link
            href="/dashboard/follow-ups/new"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Clock className="mr-1.5 h-4 w-4" />
            New Follow-up
          </Link>
          <Link
            href="/dashboard/invoices"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            New Invoice
          </Link>
          <Link
            href="/dashboard/tickets"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <LifeBuoy className="mr-1.5 h-4 w-4" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Responsive Stat Cards Grid (4 cols on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              className="relative overflow-hidden transition-all hover:shadow-md hover:border-gray-300"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {stat.title}
                </CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-gray-900">{stat.value}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{stat.subtext}</span>
                  <Link
                    href={stat.href}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    title={`View ${stat.title}`}
                  >
                    View <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's & Upcoming Follow-ups Widget */}
      <UpcomingFollowUpsWidget initialFollowUps={upcomingFollowUps} />

      {/* Two Column Layout: Recent Activity & Quick Navigation Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity Card (2 cols on large screens) */}
        <Card className="lg:col-span-2 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Recent Activity</CardTitle>
                <CardDescription>Real-time audit events, deals, and client interactions</CardDescription>
              </div>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Audit Stream
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-10">
            {/* Empty State: No recent activity yet */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-xs">
                <Activity className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">No recent activity yet</h4>
              <p className="mt-1 max-w-sm text-xs text-gray-500 leading-relaxed">
                System events, client status updates, and pipeline changes will automatically stream here once individual CRM modules are active.
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/dashboard/pipeline"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Check Pipeline
                </Link>
                <Link
                  href="/dashboard/clients"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  Explore Clients
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview & Getting Started Panel */}
        <Card className="shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-lg font-bold text-gray-900">Pulse CRM System</CardTitle>
            </div>
            <CardDescription>Platform status and module roadmap</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-blue-900">Authentication & RBAC</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Online
                </span>
              </div>
              <p className="text-xs text-blue-800/80">
                Logged in with verified role: <strong className="uppercase">{session?.user?.role}</strong>. Navigation filtered by permissions.
              </p>
            </div>

            <div className="space-y-2 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">Next Planned Modules:</p>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span>Client Directory & CRM Contacts</span>
                <span className="text-[11px] text-gray-400">Phase 2</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span>Lead Scoring & Pipeline Board</span>
                <span className="text-[11px] text-gray-400">Phase 3</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span>Invoicing & Financial Ledger</span>
                <span className="text-[11px] text-gray-400">Phase 4</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Employee & Role Management</span>
                <span className="text-[11px] text-gray-400">Phase 5</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/settings"
                className={buttonVariants({ variant: 'outline', className: 'w-full' })}
              >
                Configure Settings
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
