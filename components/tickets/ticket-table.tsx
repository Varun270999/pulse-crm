'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ticketStatuses,
  ticketPriorities,
  ticketCategories,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_CONFIG,
  type SupportTicketData,
} from '@/types/ticket';
import type { UserRole } from '@/lib/auth/rbac';
import {
  Search,
  Plus,
  LifeBuoy,
  Clock,
  AlertTriangle,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

interface TicketTableProps {
  tickets: SupportTicketData[];
  currentUserId: string;
  userRole: UserRole;
  agents: { id: string; name: string }[];
}

export function TicketTable({
  tickets,
  currentUserId,
  userRole,
  agents,
}: TicketTableProps) {
  const isAgent = userRole === 'SUPPORT_AGENT';

  const [activeTab, setActiveTab] = useState<'my' | 'all'>(isAgent ? 'my' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [agentFilter, setAgentFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Tab filter: "My Tickets" vs "All Tickets"
      if (activeTab === 'my' && t.assignedToId !== currentUserId) {
        return false;
      }

      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNumber = t.ticketNumber.toLowerCase().includes(query);
        const matchSubject = t.subject.toLowerCase().includes(query);
        const matchClient = t.client.companyName.toLowerCase().includes(query);

        if (!matchNumber && !matchSubject && !matchClient) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL' && t.status !== statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) {
        return false;
      }

      // Agent filter
      if (agentFilter !== 'ALL') {
        if (agentFilter === 'UNASSIGNED') {
          if (t.assignedToId !== null) return false;
        } else if (t.assignedToId !== agentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    tickets,
    activeTab,
    currentUserId,
    searchQuery,
    statusFilter,
    priorityFilter,
    categoryFilter,
    agentFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTickets.slice(startIndex, startIndex + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs: My Tickets vs All Tickets */}
        <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border/70 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab('my');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'my'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            My Assigned Tickets
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All Tickets ({tickets.length})
          </button>
        </div>

        {/* New Ticket Button */}
        <Link
          href="/dashboard/tickets/new"
          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 shrink-0')}
        >
          <Plus className="h-4 w-4" />
          <span>New Ticket</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search ticket #, subject, client..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Statuses</option>
          {ticketStatuses.map((s) => (
            <option key={s} value={s}>
              {TICKET_STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Priorities</option>
          {ticketPriorities.map((p) => (
            <option key={p} value={p}>
              {TICKET_PRIORITY_CONFIG[p].label}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Categories</option>
          {ticketCategories.map((c) => (
            <option key={c} value={c}>
              {TICKET_CATEGORY_CONFIG[c].label}
            </option>
          ))}
        </select>

        {/* Agent Filter */}
        <select
          value={agentFilter}
          onChange={(e) => {
            setAgentFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="ALL">All Agents</option>
          <option value="UNASSIGNED">Unassigned</option>
          {agents.map((ag) => (
            <option key={ag.id} value={ag.id}>
              {ag.name}
            </option>
          ))}
        </select>

        {(searchQuery ||
          statusFilter !== 'ALL' ||
          priorityFilter !== 'ALL' ||
          categoryFilter !== 'ALL' ||
          agentFilter !== 'ALL') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCategoryFilter('ALL');
              setAgentFilter('ALL');
              setCurrentPage(1);
            }}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Ticket Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 font-semibold">
              <tr>
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4">Due By (SLA)</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LifeBuoy className="h-8 w-8 text-muted-foreground/50 stroke-[1.5]" />
                      <p className="font-medium text-foreground">No support tickets found</p>
                      <p className="text-xs max-w-sm">
                        {searchQuery ||
                        statusFilter !== 'ALL' ||
                        priorityFilter !== 'ALL' ||
                        categoryFilter !== 'ALL' ||
                        agentFilter !== 'ALL'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'Create your first support ticket to track customer issues.'}
                      </p>
                      <Link
                        href="/dashboard/tickets/new"
                        className={cn(
                          buttonVariants({ size: 'sm', variant: 'outline' }),
                          'mt-2 gap-1.5'
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Support Ticket</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  const statusConf =
                    TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.OPEN;
                  const priorityConf =
                    TICKET_PRIORITY_CONFIG[ticket.priority] || TICKET_PRIORITY_CONFIG.MEDIUM;
                  const categoryConf =
                    TICKET_CATEGORY_CONFIG[ticket.category] || TICKET_CATEGORY_CONFIG.GENERAL;

                  const isOverdue =
                    new Date(ticket.dueBy) < new Date() &&
                    ticket.status !== 'RESOLVED' &&
                    ticket.status !== 'CLOSED';

                  const formattedCreated = new Date(ticket.createdAt).toLocaleDateString(
                    'en-GB',
                    {
                      day: '2-digit',
                      month: 'short',
                    }
                  );

                  const formattedDue = new Date(ticket.dueBy).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Ticket # */}
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="hover:underline"
                        >
                          {ticket.ticketNumber}
                        </Link>
                      </td>

                      {/* Subject */}
                      <td className="py-3 px-4 max-w-[220px]">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors truncate block"
                          title={ticket.subject}
                        >
                          {ticket.subject}
                        </Link>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/clients/${ticket.clientId}`}
                          className="text-muted-foreground hover:text-foreground hover:underline transition-colors truncate max-w-[140px] block"
                        >
                          {ticket.client.companyName}
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
                            statusConf.badgeBg,
                            statusConf.badgeText,
                            statusConf.badgeBorder
                          )}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
                            priorityConf.badgeBg,
                            priorityConf.badgeText,
                            priorityConf.badgeBorder
                          )}
                        >
                          {priorityConf.label}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
                            categoryConf.badgeBg,
                            categoryConf.badgeText,
                            categoryConf.badgeBorder
                          )}
                        >
                          {categoryConf.label}
                        </span>
                      </td>

                      {/* Assigned Agent */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {ticket.assignedTo ? (
                          <span className="flex items-center gap-1.5 text-foreground font-medium">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{ticket.assignedTo.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Due By (SLA) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-[11px]">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>Overdue: {formattedDue}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/70" />
                            <span>{formattedDue}</span>
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {formattedCreated}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/tickets/${ticket.id}`}
                          className={cn(
                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                            'h-7 px-2 text-xs text-muted-foreground group-hover:text-primary'
                          )}
                        >
                          <span>View</span>
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredTickets.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * pageSize, filteredTickets.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredTickets.length}</span> tickets
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
