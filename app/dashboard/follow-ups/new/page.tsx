import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { FollowUpForm } from '@/components/follow-ups/follow-up-form';

export const metadata = {
  title: 'Schedule Follow-up | Pulse CRM',
};

export default async function NewFollowUpPage({
  searchParams,
}: {
  searchParams?: { date?: string; clientId?: string; leadId?: string };
}) {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);
  const userRole = session.user.role;

  const salesReps = await prisma.user.findMany({
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
  });

  const rawClients = await prisma.client.findMany({
    where: userRole === 'SALES_EXECUTIVE' ? { assignedToId: session.user.id } : {},
    select: {
      id: true,
      companyName: true,
      industry: true,
    },
    orderBy: {
      companyName: 'asc',
    },
  });

  const rawLeads = await prisma.lead.findMany({
    where: userRole === 'SALES_EXECUTIVE' ? { assignedToId: session.user.id } : {},
    select: {
      id: true,
      name: true,
      companyName: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  const clients = rawClients.map((c) => ({
    id: c.id,
    name: c.companyName,
    subtitle: c.industry,
  }));

  const leads = rawLeads.map((l) => ({
    id: l.id,
    name: l.name,
    subtitle: l.companyName,
  }));

  // Parse optional date parameter
  let initialDueDate: string | undefined;
  if (searchParams?.date) {
    try {
      const d = new Date(searchParams.date);
      if (!isNaN(d.getTime())) {
        d.setHours(10, 0, 0, 0);
        const pad = (n: number) => n.toString().padStart(2, '0');
        initialDueDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
          d.getHours()
        )}:${pad(d.getMinutes())}`;
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="py-2">
      <FollowUpForm
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        }}
        salesReps={salesReps}
        clients={clients}
        leads={leads}
        defaultValues={{
          dueDate: initialDueDate,
          clientId: searchParams?.clientId,
          leadId: searchParams?.leadId,
          relatedType: searchParams?.clientId ? 'CLIENT' : searchParams?.leadId ? 'LEAD' : 'NONE',
        }}
      />
    </div>
  );
}
