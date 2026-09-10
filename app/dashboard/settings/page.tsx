import Link from 'next/link';
import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { BackupExportCard } from '@/components/settings/backup-export-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Key,
  Database,
  ArrowRight,
  Shield,
  Server,
  Mail,
  MessageSquare,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { env } from '@/lib/env';

export const metadata = {
  title: 'Settings & Administration | Pulse CRM',
};

export default async function SettingsPage() {
  await requireRole(['ADMIN']);

  // Fetch quick metrics for settings dashboard
  const [apiKeyCount, clientCount, userCount] = await Promise.all([
    prisma.apiKey.count({ where: { isActive: true } }),
    prisma.client.count(),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-blue-600" />
          System Settings & Administration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure API integrations, data backups, external webhooks, and backend services.
        </p>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-2xs border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Active API Keys</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{apiKeyCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Key className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Active CRM Users</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{userCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Shield className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs border-gray-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Clients</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{clientCount}</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Database className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Feature Card */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  External REST API Keys
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                  Generate and revoke API keys for external integrations, including automated lead-capture forms, mobile applications, and webhook callbacks.
                </CardDescription>
              </div>
            </div>

            <Link href="/dashboard/settings/api-keys">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs text-xs">
                Manage API Keys
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-xl bg-gray-50 border border-gray-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Available Endpoints:</span>
              <code className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[11px] text-gray-800 font-mono">
                POST /api/v1/leads
              </code>
              <code className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[11px] text-gray-800 font-mono">
                GET /api/v1/clients
              </code>
              <code className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[11px] text-gray-800 font-mono">
                GET /api/v1/health
              </code>
            </div>
            <span className="text-gray-500">Authentication: <code className="font-mono text-blue-600">x-api-key</code></span>
          </div>
        </CardContent>
      </Card>

      {/* Full Database Backup Card */}
      <BackupExportCard />

      {/* Integration Services Health Status */}
      <Card className="shadow-xs border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Third-Party Integration Services
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Status of configured external communication and billing gateway connectors.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
            {/* Email Service */}
            <div className="p-3.5 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Transactional Email (Resend)</p>
                  <p className="text-[11px] text-gray-500">Password resets, welcome emails, alerts</p>
                </div>
              </div>
              <div>
                {env.RESEND_API_KEY ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-200 text-[11px]">
                    Dev / Console Mode
                  </Badge>
                )}
              </div>
            </div>

            {/* SMS Service */}
            <div className="p-3.5 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">SMS Gateway (Twilio)</p>
                  <p className="text-[11px] text-gray-500">Customer notifications and follow-up reminders</p>
                </div>
              </div>
              <div>
                {env.TWILIO_ACCOUNT_SID ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-200 text-[11px]">
                    Dev / Console Mode
                  </Badge>
                )}
              </div>
            </div>

            {/* Payment Gateway */}
            <div className="p-3.5 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Payment Gateway (Razorpay)</p>
                  <p className="text-[11px] text-gray-500">Online invoice payment collection links</p>
                </div>
              </div>
              <div>
                {env.RAZORPAY_KEY_ID ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-200 text-[11px]">
                    Dev / Mock Mode
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
