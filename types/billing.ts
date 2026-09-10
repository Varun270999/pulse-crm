import type { PaymentData } from './payment';

export type QuotationStatusType =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type InvoiceStatusType =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export const quotationStatuses: QuotationStatusType[] = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
];

export const invoiceStatuses: InvoiceStatusType[] = [
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
];

export interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  indicatorColor: string;
}

export const QUOTATION_STATUS_CONFIG: Record<QuotationStatusType, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-700 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
    indicatorColor: 'bg-slate-500',
  },
  SENT: {
    label: 'Sent',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    indicatorColor: 'bg-blue-500',
  },
  ACCEPTED: {
    label: 'Accepted',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    indicatorColor: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    indicatorColor: 'bg-rose-500',
  },
  EXPIRED: {
    label: 'Expired',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    indicatorColor: 'bg-amber-500',
  },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatusType, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-700 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
    indicatorColor: 'bg-slate-500',
  },
  SENT: {
    label: 'Sent',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    indicatorColor: 'bg-blue-500',
  },
  PARTIALLY_PAID: {
    label: 'Partially Paid',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    indicatorColor: 'bg-amber-500',
  },
  PAID: {
    label: 'Paid',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    indicatorColor: 'bg-emerald-500',
  },
  OVERDUE: {
    label: 'Overdue',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    indicatorColor: 'bg-rose-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800',
    badgeText: 'text-zinc-600 dark:text-zinc-400',
    badgeBorder: 'border-zinc-200 dark:border-zinc-700',
    indicatorColor: 'bg-zinc-500',
  },
};

export interface LineItemData {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder?: number;
}

export interface ClientBrief {
  id: string;
  companyName: string;
  email?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface QuotationData {
  id: string;
  quotationNumber: string;
  clientId: string;
  dealId: string | null;
  status: QuotationStatusType;
  issueDate: string;
  validUntil: string | null;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  notes: string | null;
  termsAndConditions: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client: ClientBrief;
  deal?: { id: string; title: string } | null;
  createdBy: { id: string; name: string };
  items: LineItemData[];
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  clientId: string;
  quotationId: string | null;
  dealId: string | null;
  status: InvoiceStatusType;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes: string | null;
  termsAndConditions: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  client: ClientBrief;
  quotation?: { id: string; quotationNumber: string } | null;
  deal?: { id: string; title: string } | null;
  createdBy: { id: string; name: string };
  items: LineItemData[];
  payments?: PaymentData[];
}

export interface BillingStats {
  totalInvoiced: number;
  totalOutstanding: number;
  collectedThisMonth: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  activeQuotationsCount: number;
  activeQuotationsValue: number;
}

export const DEFAULT_TERMS_AND_CONDITIONS = `1. Payment is required within the stated due date.
2. Please quote the invoice or quotation number in all communications and payment transfers.
3. Quotations remain valid until the specified expiry date.
4. Goods/Services supplied remain the property of Pulse CRM until paid in full.
5. All disputes are subject to local jurisdiction.`;
