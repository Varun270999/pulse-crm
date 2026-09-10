export type PipelineStageType =
  | 'NEW'
  | 'QUALIFICATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface StageConfig {
  key: PipelineStageType;
  label: string;
  defaultProbability: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  columnBg: string;
  columnBorder: string;
  indicatorColor: string;
}

export const STAGES_ORDER: PipelineStageType[] = [
  'NEW',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
];

export const STAGE_DEFAULT_PROBABILITY: Record<PipelineStageType, number> = {
  NEW: 10,
  QUALIFICATION: 30,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  WON: 100,
  LOST: 0,
};

export const STAGE_CONFIG: Record<PipelineStageType, StageConfig> = {
  NEW: {
    key: 'NEW',
    label: 'New',
    defaultProbability: 10,
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    columnBg: 'bg-blue-50/20 dark:bg-blue-950/10',
    columnBorder: 'border-blue-100 dark:border-blue-900/40',
    indicatorColor: 'bg-blue-500',
  },
  QUALIFICATION: {
    key: 'QUALIFICATION',
    label: 'Qualification',
    defaultProbability: 30,
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-400',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
    columnBg: 'bg-indigo-50/20 dark:bg-indigo-950/10',
    columnBorder: 'border-indigo-100 dark:border-indigo-900/40',
    indicatorColor: 'bg-indigo-500',
  },
  PROPOSAL: {
    key: 'PROPOSAL',
    label: 'Proposal',
    defaultProbability: 50,
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    columnBg: 'bg-purple-50/20 dark:bg-purple-950/10',
    columnBorder: 'border-purple-100 dark:border-purple-900/40',
    indicatorColor: 'bg-purple-500',
  },
  NEGOTIATION: {
    key: 'NEGOTIATION',
    label: 'Negotiation',
    defaultProbability: 75,
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    columnBg: 'bg-amber-50/20 dark:bg-amber-950/10',
    columnBorder: 'border-amber-100 dark:border-amber-900/40',
    indicatorColor: 'bg-amber-500',
  },
  WON: {
    key: 'WON',
    label: 'Won',
    defaultProbability: 100,
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    columnBg: 'bg-emerald-50/20 dark:bg-emerald-950/10',
    columnBorder: 'border-emerald-100 dark:border-emerald-900/40',
    indicatorColor: 'bg-emerald-500',
  },
  LOST: {
    key: 'LOST',
    label: 'Lost',
    defaultProbability: 0,
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
    columnBg: 'bg-rose-50/20 dark:bg-rose-950/10',
    columnBorder: 'border-rose-100 dark:border-rose-900/40',
    indicatorColor: 'bg-rose-500',
  },
};

export interface DealData {
  id: string;
  title: string;
  clientId: string;
  value: number;
  stage: PipelineStageType;
  probability: number;
  expectedCloseDate: string | null;
  notes: string | null;
  lostReason: string | null;
  assignedToId: string;
  createdById: string;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    companyName: string;
    email?: string | null;
    phone?: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

export interface PipelineStats {
  totalOpenValue: number;
  weightedForecast: number;
  dealsWonThisMonth: number;
  winRate90Days: number;
}
