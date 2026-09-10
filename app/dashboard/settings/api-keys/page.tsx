import { requireRole } from '@/lib/auth/rbac';
import { getApiKeysAction } from '@/app/actions/apiKeys';
import { ApiKeysManager } from '@/components/settings/api-keys-manager';

export const metadata = {
  title: 'API Keys | Pulse CRM',
};

export default async function ApiKeysPage() {
  await requireRole(['ADMIN']);

  const res = await getApiKeysAction();
  const keys = res.success && 'keys' in res ? res.keys : [];

  return (
    <div className="max-w-6xl mx-auto py-2">
      <ApiKeysManager initialKeys={keys} />
    </div>
  );
}
