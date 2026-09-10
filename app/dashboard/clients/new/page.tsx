import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { ClientRegistrationForm } from '@/components/clients/client-registration-form';

export const metadata = {
  title: 'New Client Registration | Pulse CRM',
};

export default async function NewClientPage() {
  // Enforce RBAC: SUPPORT_AGENT is not permitted here
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);

  // Fetch active sales reps & managers for assignment dropdown
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
    <ClientRegistrationForm
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      }}
      salesReps={salesReps}
    />
  );
}
