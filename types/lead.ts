export type LeadStatusType =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'CONVERTED'
  | 'LOST';

export type LeadSourceType =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'COLD_CALL'
  | 'SOCIAL_MEDIA'
  | 'EVENT'
  | 'OTHER';

export interface LeadData {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  source: LeadSourceType;
  status: LeadStatusType;
  estimatedValue: number | null;
  notes: string | null;
  assignedToId: string;
  createdById: string;
  convertedClientId: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  convertedClient?: {
    id: string;
    companyName: string;
  } | null;
}

export const LEAD_STATUS_CONFIG: Record<
  LeadStatusType,
  {
    label: string;
    color: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    headerBg: string;
  }
> = {
  NEW: {
    label: 'New',
    color: 'blue',
    badgeBg: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
    badgeText: 'text-blue-700',
    border: 'border-t-blue-500',
    headerBg: 'bg-blue-50/70',
  },
  CONTACTED: {
    label: 'Contacted',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    badgeText: 'text-amber-700',
    border: 'border-t-amber-500',
    headerBg: 'bg-amber-50/70',
  },
  QUALIFIED: {
    label: 'Qualified',
    color: 'purple',
    badgeBg: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20',
    badgeText: 'text-purple-700',
    border: 'border-t-purple-500',
    headerBg: 'bg-purple-50/70',
  },
  PROPOSAL_SENT: {
    label: 'Proposal Sent',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
    badgeText: 'text-indigo-700',
    border: 'border-t-indigo-500',
    headerBg: 'bg-indigo-50/70',
  },
  CONVERTED: {
    label: 'Converted',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    badgeText: 'text-emerald-700',
    border: 'border-t-emerald-500',
    headerBg: 'bg-emerald-50/70',
  },
  LOST: {
    label: 'Lost',
    color: 'rose',
    badgeBg: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
    badgeText: 'text-rose-700',
    border: 'border-t-rose-500',
    headerBg: 'bg-rose-50/70',
  },
};

export const LEAD_SOURCE_LABELS: Record<LeadSourceType, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  COLD_CALL: 'Cold Call',
  SOCIAL_MEDIA: 'Social Media',
  EVENT: 'Event',
  OTHER: 'Other',
};
