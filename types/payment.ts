export type PaymentMethodType =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CHEQUE'
  | 'OTHER';

export const paymentMethods: PaymentMethodType[] = [
  'UPI',
  'BANK_TRANSFER',
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CHEQUE',
  'OTHER',
];

export interface PaymentMethodConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethodType, PaymentMethodConfig> = {
  UPI: {
    label: 'UPI',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
  },
  BANK_TRANSFER: {
    label: 'Bank Transfer',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
  },
  CASH: {
    label: 'Cash',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
  },
  CREDIT_CARD: {
    label: 'Credit Card',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
  },
  DEBIT_CARD: {
    label: 'Debit Card',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-400',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800',
  },
  CHEQUE: {
    label: 'Cheque',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-400',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
  },
  OTHER: {
    label: 'Other',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-700 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
  },
};

export interface PaymentData {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  paymentDate: string;
  referenceNumber: string | null;
  notes: string | null;
  recordedById: string;
  createdAt: string;
  recordedBy?: {
    id: string;
    name: string;
    email?: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate?: string;
    issueDate?: string;
  };
  client?: {
    id: string;
    companyName: string;
    email?: string | null;
    phone?: string | null;
    addressLine?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
}

export interface PaymentStats {
  totalCollectedThisMonth: number;
  totalCollectedAllTime: number;
  totalOutstandingBalance: number;
  totalPaymentsCount: number;
}
