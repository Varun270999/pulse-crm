'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  createApiKeyAction,
  toggleApiKeyStatusAction,
  deleteApiKeyAction,
} from '@/app/actions/apiKeys';

export interface ApiKeyItem {
  id: string;
  label: string;
  maskedKey: string;
  isActive: boolean;
  createdById: string;
  createdByName?: string | null;
  createdAt: Date | string;
  lastUsedAt?: Date | string | null;
}

interface ApiKeysManagerProps {
  initialKeys: ApiKeyItem[];
}

export function ApiKeysManager({ initialKeys }: ApiKeysManagerProps) {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyItem[]>(initialKeys);
  const [isPending, startTransition] = useTransition();

  // Create Key Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Show Newly Generated Key Modal State
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCreateKey = () => {
    if (!labelInput.trim()) {
      setCreateError('Please enter a descriptive label.');
      return;
    }

    setCreateError(null);
    startTransition(async () => {
      const res = await createApiKeyAction(labelInput);
      if (res.error) {
        setCreateError(res.error);
      } else if (res.success && res.rawKey && res.key) {
        setKeys((prev) => [res.key, ...prev]);
        setGeneratedKey(res.rawKey);
        setIsCreateOpen(false);
        setLabelInput('');
        router.refresh();
      }
    });
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, isActive: nextStatus } : k))
    );

    startTransition(async () => {
      await toggleApiKeyStatusAction(id, nextStatus);
      router.refresh();
    });
  };

  const handleDeleteKey = (id: string, label: string) => {
    if (!confirm(`Are you sure you want to permanently delete API key "${label}"? Any external applications using this key will immediately lose access.`)) {
      return;
    }

    setKeys((prev) => prev.filter((k) => k.id !== id));

    startTransition(async () => {
      await deleteApiKeyAction(id);
      router.refresh();
    });
  };

  const copyToClipboard = (text: string, isRaw = false) => {
    navigator.clipboard.writeText(text);
    if (isRaw) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2.5">
            <Key className="h-6 w-6 text-blue-600" />
            API Keys & Integrations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage external REST API keys for website lead capture forms, webhooks, and third-party apps.
          </p>
        </div>

        <Button
          onClick={() => {
            setLabelInput('');
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs rounded-xl"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Generate New Key
        </Button>
      </div>

      {/* Integration Quick Guide */}
      <Card className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-blue-100 shadow-2xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                REST API Endpoints for Developers
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Pass your active key in the <code className="text-[11px] font-mono bg-white/80 px-1 py-0.5 rounded border border-blue-200">x-api-key</code> header to authenticate requests.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/80 border-blue-200 text-blue-800 text-xs font-mono">
              POST /api/v1/leads
            </Badge>
            <Badge variant="outline" className="bg-white/80 border-blue-200 text-blue-800 text-xs font-mono">
              GET /api/v1/clients
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Active API Keys</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                {keys.length} key{keys.length === 1 ? '' : 's'} registered
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {keys.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 text-gray-400 mb-3">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">No API keys generated yet</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Generate an API key to securely connect website contact forms, automated scripts, or external systems.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 rounded-xl text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create your first key
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Label & Key</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created By</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4">Last Used</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{k.label}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[11px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            {k.maskedKey}
                          </code>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {k.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {k.createdByName || 'Admin'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(k.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        {k.lastUsedAt ? (
                          new Date(k.lastUsedAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-gray-400 italic">Never</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(k.id, k.isActive)}
                            title={k.isActive ? 'Revoke Key' : 'Activate Key'}
                            disabled={isPending}
                            className={`h-7 px-2 text-xs rounded-lg ${
                              k.isActive
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="h-3.5 w-3.5 mr-1" />
                            {k.isActive ? 'Revoke' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteKey(k.id, k.label)}
                            title="Delete API Key"
                            disabled={isPending}
                            className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL 1: Create API Key Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150 backdrop-blur-xs">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Generate New API Key</h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter a clear name identifying what service or team will use this key.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">
                Key Label / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Marketing Website Contact Form"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-300 px-3.5 py-2.5 text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                autoFocus
              />
              {createError && (
                <p className="text-xs text-red-600 font-medium">{createError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={isPending}
                className="rounded-xl text-xs text-gray-600"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateKey}
                disabled={isPending || !labelInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Generating...
                  </>
                ) : (
                  'Generate Key'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Newly Generated Raw Key (Show ONCE) */}
      {generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">API Key Generated Successfully</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Please copy and store this key securely. For security reasons, you will not be able to view it again.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Secret API Key
                </span>
                {copiedKey && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Copied to clipboard
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono font-bold text-gray-900 bg-white p-2.5 rounded-lg border border-gray-200 break-all select-all">
                  {generatedKey}
                </code>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(generatedKey, true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-lg h-9 px-3"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Important Security Notice:</p>
              <p className="text-amber-800">
                Treat this key like a password. Do not commit it to version control or expose it in public client-side browser JavaScript.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setGeneratedKey(null)}
                className="bg-gray-900 hover:bg-black text-white rounded-xl text-xs px-5"
              >
                I have saved my key
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
