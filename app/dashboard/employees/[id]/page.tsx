import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { EmployeeDetailView } from '@/components/employees/employee-detail-view';
import type { EmployeeData, PerformanceSnapshotData } from '@/types/employee';

export const metadata = {
  title: 'Employee Details | Pulse CRM',
};

interface EmployeeDetailPageProps {
  params: {
    id: string;
  };
}

export default async function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  // Strict ADMIN-only RBAC guard
  const session = await requireRole(['ADMIN']);

  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    notFound();
  }

  // Load performance snapshot metrics
  const [
    assignedClientsCount,
    activeLeadsCount,
    openDeals,
    assignedOpenTicketsCount,
    totalAssignedTicketsCount,
    resolvedTicketsCount,
    createdClientsCount,
    createdTicketsCount,
  ] = await Promise.all([
    prisma.client.count({ where: { assignedToId: user.id } }),
    prisma.lead.count({
      where: {
        assignedToId: user.id,
        status: { notIn: ['CONVERTED', 'LOST'] },
      },
    }),
    prisma.deal.findMany({
      where: {
        assignedToId: user.id,
        stage: { notIn: ['WON', 'LOST'] },
      },
      select: { value: true },
    }),
    prisma.supportTicket.count({
      where: {
        assignedToId: user.id,
        status: { in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD'] },
      },
    }),
    prisma.supportTicket.count({ where: { assignedToId: user.id } }),
    prisma.supportTicket.count({
      where: {
        assignedToId: user.id,
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
    }),
    prisma.client.count({ where: { createdById: user.id } }),
    prisma.supportTicket.count({ where: { createdById: user.id } }),
  ]);

  const openDealsCount = openDeals.length;
  const openDealsValue = openDeals.reduce((sum, d) => sum + Number(d.value), 0);

  const snapshot: PerformanceSnapshotData = {
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

  const serializedEmployee: EmployeeData = {
    id: user.id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    joiningDate: user.joiningDate ? user.joiningDate.toISOString() : null,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  return (
    <div className="py-2">
      <EmployeeDetailView
        employee={serializedEmployee}
        snapshot={snapshot}
        currentUserId={session.user.id}
      />
    </div>
  );
}
