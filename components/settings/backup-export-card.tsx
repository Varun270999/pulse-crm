'use client';

import { useState, useTransition } from 'react';
import {
  Download,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileJson,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { exportAllDataAction, type BackupSummary } from '@/app/actions/backup';

export function BackupExportCard() {
  const [isPending, startTransition] = useTransition();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<BackupSummary | null>(null);

  const handleExportData = () => {
    setErrorMessage(null);
    setDownloadSuccess(null);

    startTransition(async () => {
      const res = await exportAllDataAction();

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.success && 'jsonString' in res && 'filename' in res) {
        // Trigger browser download via Blob
        try {
          const blob = new Blob([res.jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = res.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          setLastSummary(res.summary);
          setDownloadSuccess(`Successfully exported database backup (${res.filename}).`);
        } catch (downloadErr) {
          console.error('Download trigger error:', downloadErr);
          setErrorMessage('Failed to trigger browser download.');
        }
      }
    });
  };

  return (
    <Card className="shadow-xs border-gray-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Data Portability & Full Database Backup
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                Export a complete snapshot of all CRM core entities—including Clients, Contacts, Leads, Deals, Quotations, Invoices, Payments, Support Tickets, and Follow-ups—into a portable JSON backup file.
              </CardDescription>
            </div>
          </div>

          <Button
            onClick={handleExportData}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs shrink-0"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Dumping Core Tables...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Included Data Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-gray-100 text-xs">
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">Clients & Contacts</p>
              <p className="text-[10px] text-gray-400">All registered records</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">Leads & Pipeline</p>
              <p className="text-[10px] text-gray-400">Deals, stages, win history</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">Invoices & Receipts</p>
              <p className="text-[10px] text-gray-400">Full payment transaction log</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
            <FileJson className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-800">Tickets & Tasks</p>
              <p className="text-[10px] text-gray-400">Support threads & follow-ups</p>
            </div>
          </div>
        </div>

        {/* Feedback states */}
        {downloadSuccess && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <p className="font-semibold">{downloadSuccess}</p>
              {lastSummary && (
                <p className="text-emerald-700 mt-1">
                  Exported {lastSummary.clients} clients, {lastSummary.leads} leads, {lastSummary.deals} deals, {lastSummary.invoices} invoices, {lastSummary.payments} payments, {lastSummary.supportTickets} tickets, and {lastSummary.followUps} follow-ups.
                </p>
              )}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-900">
              <p className="font-semibold">Export Failed</p>
              <p className="text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <Shield className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span>Restricted to administrators. Password hashes and sensitive session secrets are excluded from backups.</span>
        </div>
      </CardContent>
    </Card>
  );
}
