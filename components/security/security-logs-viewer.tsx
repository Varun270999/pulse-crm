'use client';

import { useState, useTransition } from 'react';
import {
  ShieldAlert,
  Activity,
  UserCheck,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download,
  Shield,
  Loader2,
} from 'lucide-react';
import { getSecurityLogsAction } from '@/app/actions/security';

export interface SerializedActivityLog {
  id: string;
  action: string;
  userId: string | null;
  entityType: string | null;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string | Date;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface SecurityKPIStats {
  failedLoginsLast24h: number;
  totalActionsLast24h: number;
  mostActiveUser: {
    name: string;
    email: string;
    actionCount: number;
  } | null;
}

interface SecurityLogsViewerProps {
  initialLogs: SerializedActivityLog[];
  initialPagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  initialStats: SecurityKPIStats;
  users: { id: string; name: string; email: string }[];
}

function parseUserAgent(ua?: string | null): string {
  if (!ua) return 'Unknown Client';
  if (ua.includes('PostmanRuntime')) return 'Postman';
  if (ua.includes('curl')) return 'curl';
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  let os = '';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return os ? `${browser} (${os})` : browser;
}

function formatRelativeTime(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatExactDateTime(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function getActionBadgeStyle(action: string) {
  if (action === 'USER_LOGIN_FAILED' || action === 'RATE_LIMIT_EXCEEDED') {
    return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
  }
  if (action.includes('DELETED') || action.includes('REVOKED') || action.includes('DEACTIVATED') || action === 'DEAL_LOST') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (action.includes('CREATED') || action.includes('ACTIVATED') || action === 'USER_LOGIN' || action === 'DEAL_WON') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (action.includes('UPDATED') || action.includes('CHANGED') || action.includes('RESET')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (action.includes('EXPORTED') || action === 'USER_LOGOUT') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

export function SecurityLogsViewer({
  initialLogs,
  initialPagination,
  initialStats,
  users,
}: SecurityLogsViewerProps) {
  const [isPending, startTransition] = useTransition();

  const [logs, setLogs] = useState<SerializedActivityLog[]>(initialLogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState<SecurityKPIStats>(initialStats);

  // Filter states
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchLogs = (
    nextPage = page,
    nextPageSize = pageSize,
    nextSearch = search,
    nextAction = actionFilter,
    nextUser = userFilter,
    nextDateRange = dateRange
  ) => {
    startTransition(async () => {
      const res = await getSecurityLogsAction({
        page: nextPage,
        pageSize: nextPageSize,
        search: nextSearch,
        actionFilter: nextAction,
        userFilter: nextUser,
        dateRange: nextDateRange,
      });

      if (res.success && res.logs) {
        setLogs(res.logs as SerializedActivityLog[]);
        setPagination(res.pagination);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1, pageSize, search, actionFilter, userFilter, dateRange);
  };

  const handleActionChange = (newAction: string) => {
    setActionFilter(newAction);
    setPage(1);
    fetchLogs(1, pageSize, search, newAction, userFilter, dateRange);
  };

  const handleUserChange = (newUser: string) => {
    setUserFilter(newUser);
    setPage(1);
    fetchLogs(1, pageSize, search, actionFilter, newUser, dateRange);
  };

  const handleDateRangeChange = (newRange: 'all' | 'today' | '7d' | '30d') => {
    setDateRange(newRange);
    setPage(1);
    fetchLogs(1, pageSize, search, actionFilter, userFilter, newRange);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchLogs(newPage, pageSize, search, actionFilter, userFilter, dateRange);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
    fetchLogs(1, newPageSize, search, actionFilter, userFilter, dateRange);
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('ALL');
    setUserFilter('ALL');
    setDateRange('all');
    setPage(1);
    fetchLogs(1, pageSize, '', 'ALL', 'ALL', 'all');
  };

  // Export current logs view to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'User Name', 'User Email', 'Entity Type', 'Entity ID', 'Description', 'IP Address', 'User Agent'];
    const rows = logs.map((log) => [
      `"${formatExactDateTime(log.createdAt)}"`,
      `"${log.action}"`,
      `"${log.user?.name || 'System / Unauthenticated'}"`,
      `"${log.user?.email || ''}"`,
      `"${log.entityType || ''}"`,
      `"${log.entityId || ''}"`,
      `"${(log.description || '').replace(/"/g, '""')}"`,
      `"${log.ipAddress || ''}"`,
      `"${(log.userAgent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `security-activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Security & Activity Logs</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              <Shield className="h-3 w-3 text-blue-600" />
              ADMIN AUDIT
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time immutable audit trail of authentication attempts, administrative operations, and CRM modifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs()}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh logs"
          >
            <RotateCcw className={`h-4 w-4 ${isPending ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Failed Logins (24h) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed Logins (24h)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-gray-900">
                {stats.failedLoginsLast24h}
              </span>
              {stats.failedLoginsLast24h > 0 && (
                <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Needs Review
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Failed authentication & rate limit hits</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stats.failedLoginsLast24h > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Total System Actions (24h) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Actions (24h)</p>
            <span className="text-3xl font-extrabold tracking-tight text-blue-600">
              {stats.totalActionsLast24h}
            </span>
            <p className="text-xs text-gray-400">Audit events logged past 24 hours</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Most Active User (7d) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Most Active User (7d)</p>
            <p className="text-lg font-bold text-gray-900 truncate">
              {stats.mostActiveUser ? stats.mostActiveUser.name : 'No Activity'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {stats.mostActiveUser
                ? `${stats.mostActiveUser.actionCount} events (${stats.mostActiveUser.email})`
                : 'Last 7 days'}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, user name, email, action, or IP address..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Action Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => handleActionChange(e.target.value)}
                className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Actions</option>
                <option value="AUTH">Authentication (Logins & Lockouts)</option>
                <option value="CLIENT">Clients (Created, Updated, Deleted)</option>
                <option value="DEAL">Deals & Pipeline</option>
                <option value="BILLING">Billing & Invoices</option>
                <option value="EMPLOYEE">Employees & Roles</option>
                <option value="INTEGRATION">API & Integrations</option>
                <option disabled>──────────</option>
                <option value="USER_LOGIN">USER_LOGIN</option>
                <option value="USER_LOGIN_FAILED">USER_LOGIN_FAILED</option>
                <option value="RATE_LIMIT_EXCEEDED">RATE_LIMIT_EXCEEDED</option>
                <option value="CLIENT_CREATED">CLIENT_CREATED</option>
                <option value="CLIENT_UPDATED">CLIENT_UPDATED</option>
                <option value="CLIENT_DELETED">CLIENT_DELETED</option>
                <option value="DEAL_STAGE_CHANGED">DEAL_STAGE_CHANGED</option>
                <option value="INVOICE_CREATED">INVOICE_CREATED</option>
                <option value="INVOICE_DELETED">INVOICE_DELETED</option>
                <option value="PAYMENT_RECORDED">PAYMENT_RECORDED</option>
                <option value="EMPLOYEE_CREATED">EMPLOYEE_CREATED</option>
                <option value="EMPLOYEE_ROLE_CHANGED">EMPLOYEE_ROLE_CHANGED</option>
                <option value="EMPLOYEE_DEACTIVATED">EMPLOYEE_DEACTIVATED</option>
                <option value="API_KEY_GENERATED">API_KEY_GENERATED</option>
                <option value="DATA_EXPORTED">DATA_EXPORTED</option>
              </select>
            </div>

            {/* User Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500">User:</span>
              <select
                value={userFilter}
                onChange={(e) => handleUserChange(e.target.value)}
                className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
              >
                <option value="ALL">All Users</option>
                <option value="SYSTEM">System / Unauthenticated</option>
                <option disabled>──────────</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500">Range:</span>
              <select
                value={dateRange}
                onChange={(e) =>
                  handleDateRangeChange(e.target.value as 'all' | 'today' | '7d' | '30d')
                }
                className="text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
              </select>
            </div>

            {(search || actionFilter !== 'ALL' || userFilter !== 'ALL' || dateRange !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-1.5 py-1"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Page size indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 font-medium"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[300px] relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading logs...</span>
              </div>
            </div>
          )}

          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 pl-4 pr-3 sm:pl-6">Timestamp</th>
                <th className="py-3.5 px-3">Actor / User</th>
                <th className="py-3.5 px-3">Action</th>
                <th className="py-3.5 px-3">Entity</th>
                <th className="py-3.5 px-3 min-w-[240px]">Description</th>
                <th className="py-3.5 px-3">IP Address</th>
                <th className="py-3.5 pr-4 pl-3 sm:pr-6">Client / UA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-normal">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">No activity logs found</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        No security or system events match your current filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 pl-4 pr-3 sm:pl-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{formatRelativeTime(log.createdAt)}</span>
                        <span className="text-[11px] text-gray-400">{formatExactDateTime(log.createdAt)}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {log.user ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{log.user.name}</span>
                          <span className="text-[11px] text-gray-500">{log.user.email}</span>
                          <span className="text-[10px] text-blue-600 font-medium">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-200">
                          System / Unknown
                        </span>
                      )}
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg border ${getActionBadgeStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {log.entityType ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{log.entityType}</span>
                          {log.entityId && (
                            <span className="text-[10px] font-mono text-gray-400 truncate max-w-[120px]" title={log.entityId}>
                              {log.entityId}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-3 text-gray-700">
                      <p className="line-clamp-2 leading-relaxed">{log.description}</p>
                    </td>

                    {/* IP Address */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {log.ipAddress ? (
                        <span className="font-mono text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {log.ipAddress}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Client / UA */}
                    <td className="py-3.5 pr-4 pl-3 sm:pr-6 whitespace-nowrap">
                      <span className="text-[11px] text-gray-500" title={log.userAgent || 'Unknown'}>
                        {parseUserAgent(log.userAgent)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-gray-200 bg-gray-50/50">
          <div className="text-xs text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-900">
              {logs.length === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-gray-900">
              {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}
            </span>{' '}
            of <span className="font-medium text-gray-900">{pagination.totalCount}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-medium text-gray-700 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
