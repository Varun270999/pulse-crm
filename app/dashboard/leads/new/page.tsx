import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { LeadCaptureForm } from '@/components/leads/lead-capture-form';

export const metadata = {
  title: 'Add New Lead | Pulse CRM',
};

export default async function NewLeadPage() {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);

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

  return (
    <div className="py-2">
      <LeadCaptureForm
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        }}
        salesReps={salesReps}
      />
    </div>
  );
}
