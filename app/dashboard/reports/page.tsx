import { requireRole } from '@/lib/auth/rbac';
import { getReportsDataAction } from '@/app/actions/reports';
import { ReportsView } from '@/components/reports/reports-view';

export const metadata = {
  title: 'Reports & Analytics | Pulse CRM',
};

export default async function ReportsPage() {
  // Guard access: ADMIN, MANAGER, and SALES_EXECUTIVE allowed.
  // SUPPORT_AGENT will be redirected to /dashboard?error=access_denied automatically.
  await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);

  const res = await getReportsDataAction({ type: 'THIS_MONTH' });

  if (res.error || !res.data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-base font-semibold">Failed to load reports data.</p>
        <p className="text-xs mt-1">{res.error || 'Please try again later.'}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ReportsView initialData={res.data} />
    </div>
  );
}
