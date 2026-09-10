import type { UserRole } from '@/lib/auth/rbac';

export type DateRangeType =
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface DateRangeFilter {
  type: DateRangeType;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface MonthlyWonLostPoint {
  month: string;
  won: number;
  lost: number;
}

export interface StageDistributionPoint {
  stage: string;
  label: string;
  count: number;
  value: number;
}

export interface SalesOverviewData {
  revenueTrend: MonthlyRevenuePoint[];
  wonVsLostTrend: MonthlyWonLostPoint[];
  stageDistribution: StageDistributionPoint[];
  totalRevenue: number;
  dealsWon: number;
  avgDealSize: number;
  winRate: number; // 0-100
}

export interface FunnelStepPoint {
  stage: string;
  label: string;
  count: number;
  conversionRateFromPrev: number; // % converted from previous stage
  conversionRateFromTotal: number; // % converted from stage 1 (New)
}

export interface LeadSourcePoint {
  source: string;
  label: string;
  count: number;
  percentage: number;
}

export interface LeadsConversionData {
  funnelSteps: FunnelStepPoint[];
  leadsBySource: LeadSourcePoint[];
  totalLeads: number;
  conversionRate: number; // % of total leads converted
  avgTimeToConversionDays: number;
}

export interface SalesRepLeaderboardItem {
  id: string;
  name: string;
  email: string;
  leadsAssigned: number;
  dealsWon: number;
  revenueGenerated: number;
}

export interface SupportAgentMetricItem {
  id: string;
  name: string;
  email: string;
  ticketsResolved: number;
  avgResolutionHours: number;
}

export interface EmployeePerformanceData {
  salesLeaderboard: SalesRepLeaderboardItem[];
  revenuePerRepChart: { name: string; revenue: number }[];
  supportAgentMetrics: SupportAgentMetricItem[];
}

export interface TopClientRevenueItem {
  id: string;
  companyName: string;
  totalRevenue: number;
  invoiceCount: number;
}

export interface ClientRevenueData {
  totalActiveClients: number;
  newClientsCount: number;
  totalOutstanding: number;
  topClients: TopClientRevenueItem[];
}

export interface MyPerformanceData {
  totalLeads: number;
  convertedLeads: number;
  dealsWonCount: number;
  dealsWonValue: number;
  revenueContribution: number;
  dealsByStage: { stage: string; label: string; count: number; value: number }[];
}

export interface ReportsData {
  userRole: UserRole;
  dateRange: DateRangeFilter;
  rangeLabel: string;
  startDate: string;
  endDate: string;
  salesOverview?: SalesOverviewData;
  leadsConversion?: LeadsConversionData;
  employeePerformance?: EmployeePerformanceData;
  clientRevenue?: ClientRevenueData;
  myPerformance?: MyPerformanceData;
}
