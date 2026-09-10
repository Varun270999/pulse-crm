'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { LineItemsTable } from '@/components/invoices/line-items-table';
import { createQuotationAction } from '@/app/actions/billing';
import {
  DEFAULT_TERMS_AND_CONDITIONS,
  type LineItemData,
} from '@/types/billing';
import {
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientOption {
  id: string;
  companyName: string;
}

interface DealOption {
  id: string;
  title: string;
  clientId: string;
}

interface QuotationFormProps {
  clients: ClientOption[];
  deals: DealOption[];
  initialClientId?: string;
  initialDealId?: string;
  onSuccess?: (quotationId: string) => void;
  onCancel?: () => void;
}

export function QuotationForm({
  clients,
  deals,
  initialClientId,
  initialDealId,
  onSuccess,
  onCancel,
}: QuotationFormProps) {
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [selectedClientId, setSelectedClientId] = useState(
    initialClientId || (clients[0]?.id ?? '')
  );
  const [selectedDealId, setSelectedDealId] = useState(initialDealId || '');
  const [issueDate, setIssueDate] = useState(todayStr);
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [taxPercent, setTaxPercent] = useState<number>(18);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState(DEFAULT_TERMS_AND_CONDITIONS);

  const [items, setItems] = useState<LineItemData[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter deals by selected client
  const clientDeals = deals.filter((d) => d.clientId === selectedClientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Please select a client.');
      return;
    }

    const validItems = items.filter((it) => it.description.trim().length > 0);
    if (validItems.length === 0) {
      setError('Please add at least one line item with a description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createQuotationAction({
        clientId: selectedClientId,
        dealId: selectedDealId || undefined,
        issueDate,
        validUntil: validUntil || undefined,
        taxPercent,
        discountPercent,
        notes,
        termsAndConditions: terms,
        items: validItems,
      });

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else if (res.quotationId) {
        if (onSuccess) {
          onSuccess(res.quotationId);
        } else {
          router.push(`/dashboard/quotations/${res.quotationId}`);
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-4xl mx-auto border-border/80 shadow-xs">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/invoices?tab=quotations"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
            )}
            title="Back to Quotations"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              Create New Quotation
            </CardTitle>
            <CardDescription>
              Draft a formal estimate with line items, tax, and discount terms
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client & Deal Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="clientId" className="text-xs font-semibold">
                Client Company <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  id="clientId"
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedDealId('');
                  }}
                  disabled={isSubmitting}
                  className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <option value="" disabled>Select a client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deal (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="dealId" className="text-xs font-semibold">
                Associated Deal (Optional)
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <select
                  id="dealId"
                  value={selectedDealId}
                  onChange={(e) => setSelectedDealId(e.target.value)}
                  disabled={isSubmitting || clientDeals.length === 0}
                  className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-60"
                >
                  <option value="">
                    {clientDeals.length === 0
                      ? 'No deals for selected client'
                      : 'None (Standalone Quotation)'}
                  </option>
                  {clientDeals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dates: Issue Date & Valid Until Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate" className="text-xs font-semibold">
                Quotation Date <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil" className="text-xs font-semibold">
                Valid Until
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="validUntil"
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-9 text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Line Items Builder & Financial Totals */}
          <div className="pt-2">
            <LineItemsTable
              items={items}
              onChangeItems={setItems}
              taxPercent={taxPercent}
              onChangeTaxPercent={setTaxPercent}
              discountPercent={discountPercent}
              onChangeDiscountPercent={setDiscountPercent}
              disabled={isSubmitting}
            />
          </div>

          {/* Notes & Terms and Conditions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-semibold">
                Proposal Notes / Scope Overview
              </Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="e.g. Scope encompasses full design, backend API development, and 90-day post-launch warranty."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms" className="text-xs font-semibold">
                Terms & Conditions
              </Label>
              <Textarea
                id="terms"
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                disabled={isSubmitting}
                className="text-xs font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            ) : (
              <Link
                href="/dashboard/invoices?tab=quotations"
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Cancel
              </Link>
            )}

            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Create Quotation'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
