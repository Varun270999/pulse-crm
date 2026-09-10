import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(val?: number | string | null): string {
  if (val === null || val === undefined || val === '') return '—';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function getStatusBadgeClass(status?: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-700 border-gray-200';
  const s = status.toUpperCase();

  // Success / Active / Won / Completed / Paid / Accepted
  if (['ACTIVE', 'WON', 'PAID', 'ACCEPTED', 'COMPLETED', 'RESOLVED', 'API_KEY_ACTIVATED'].includes(s)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
  }

  // Danger / Inactive / Lost / Cancelled / Overdue / Rejected / Urgent / Deleted
  if (
    [
      'INACTIVE',
      'LOST',
      'OVERDUE',
      'REJECTED',
      'CANCELLED',
      'URGENT',
      'FAILED',
      'REVOKED',
      'API_KEY_REVOKED',
      'DELETED',
    ].includes(s)
  ) {
    return 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
  }

  // Warning / In-Progress / Pending / Negotiation / Proposal / High / Medium
  if (
    [
      'PENDING',
      'IN_PROGRESS',
      'PROPOSAL',
      'NEGOTIATION',
      'PARTIALLY_PAID',
      'ON_HOLD',
      'HIGH',
      'MEDIUM',
    ].includes(s)
  ) {
    return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
  }

  // Info / Open / Draft / New / Low / Qualification / Sent
  if (
    [
      'NEW',
      'QUALIFICATION',
      'DRAFT',
      'SENT',
      'OPEN',
      'LOW',
      'GENERAL',
      'TECHNICAL',
      'BILLING',
      'FEATURE_REQUEST',
    ].includes(s)
  ) {
    return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  }

  return 'bg-gray-100 text-gray-700 border-gray-200 font-medium';
}
