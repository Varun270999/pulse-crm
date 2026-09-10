'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  updateTicketStatusAction,
  updateTicketPriorityAction,
  reassignTicketAction,
  addTicketReplyAction,
} from '@/app/actions/tickets';
import {
  ticketStatuses,
  ticketPriorities,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_CONFIG,
  type SupportTicketData,
  type TicketStatusType,
  type TicketPriorityType,
  type TicketReplyData,
} from '@/types/ticket';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  Send,
  Lock,
  MessageSquare,
  Building2,
  Calendar,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface TicketDetailViewProps {
  ticket: SupportTicketData;
  agents: { id: string; name: string; role: string }[];
}

export function TicketDetailView({
  ticket: initialTicket,
  agents,
}: TicketDetailViewProps) {
  const [ticket, setTicket] = useState<SupportTicketData>(initialTicket);
  const [replies, setReplies] = useState<TicketReplyData[]>(initialTicket.replies || []);

  // Quick action states
  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  // Reply composer states
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Status handler
  async function handleStatusChange(newStatus: TicketStatusType) {
    if (newStatus === ticket.status) return;
    setStatusLoading(true);

    try {
      const res = await updateTicketStatusAction({
        id: ticket.id,
        status: newStatus,
      });

      if (res.success) {
        setTicket((prev) => ({
          ...prev,
          status: newStatus,
          resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : prev.resolvedAt,
          closedAt: newStatus === 'CLOSED' ? new Date().toISOString() : null,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  }

  // Priority handler
  async function handlePriorityChange(newPriority: TicketPriorityType) {
    if (newPriority === ticket.priority) return;
    setPriorityLoading(true);

    try {
      const res = await updateTicketPriorityAction({
        id: ticket.id,
        priority: newPriority,
      });

      if (res.success && res.dueBy) {
        setTicket((prev) => ({
          ...prev,
          priority: newPriority,
          dueBy: res.dueBy!,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPriorityLoading(false);
    }
  }

  // Reassign handler
  async function handleReassign(agentId: string) {
    setAssignLoading(true);

    try {
      const targetAgent = agents.find((a) => a.id === agentId) || null;
      const res = await reassignTicketAction({
        id: ticket.id,
        assignedToId: agentId || null,
      });

      if (res.success) {
        setTicket((prev) => ({
          ...prev,
          assignedToId: agentId || null,
          assignedTo: targetAgent
            ? { id: targetAgent.id, name: targetAgent.name, role: targetAgent.role }
            : null,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssignLoading(false);
    }
  }

  // Post Reply handler
  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setReplyLoading(true);
    setReplyError(null);

    try {
      const res = await addTicketReplyAction({
        ticketId: ticket.id,
        message: replyMessage.trim(),
        isInternal,
      });

      if (res.error) {
        setReplyError(res.error);
      } else if (res.reply) {
        setReplies((prev) => [...prev, res.reply as TicketReplyData]);
        setReplyMessage('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post reply.';
      setReplyError(msg);
    } finally {
      setReplyLoading(false);
    }
  }

  const statusConf = TICKET_STATUS_CONFIG[ticket.status] || TICKET_STATUS_CONFIG.OPEN;
  const priorityConf = TICKET_PRIORITY_CONFIG[ticket.priority] || TICKET_PRIORITY_CONFIG.MEDIUM;
  const categoryConf = TICKET_CATEGORY_CONFIG[ticket.category] || TICKET_CATEGORY_CONFIG.GENERAL;

  const isOverdue =
    new Date(ticket.dueBy) < new Date() &&
    ticket.status !== 'RESOLVED' &&
    ticket.status !== 'CLOSED';

  const formattedCreated = new Date(ticket.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDue = new Date(ticket.dueBy).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/tickets"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Tickets</span>
          </Link>
          <span className="font-mono text-xs font-bold text-muted-foreground">
            {ticket.ticketNumber}
          </span>
        </div>

        {/* SLA Status Indicator */}
        <div>
          {isOverdue ? (
            <div className="inline-flex items-center gap-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-full text-xs font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>SLA Breached / Overdue ({formattedDue})</span>
            </div>
          ) : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' ? (
            <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Resolution Completed</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-muted-foreground bg-muted/60 border border-border/70 px-3 py-1 rounded-full text-xs font-medium">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>SLA Target: {formattedDue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Ticket Banner & Quick Controls Card */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Title, Client, and Quick Selectors */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-border/70">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  statusConf.badgeBg,
                  statusConf.badgeText,
                  statusConf.badgeBorder
                )}
              >
                {statusConf.label}
              </span>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  priorityConf.badgeBg,
                  priorityConf.badgeText,
                  priorityConf.badgeBorder
                )}
              >
                {priorityConf.label} Priority
              </span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
                  categoryConf.badgeBg,
                  categoryConf.badgeText,
                  categoryConf.badgeBorder
                )}
              >
                {categoryConf.label}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {ticket.subject}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Client: </span>
                <Link
                  href={`/dashboard/clients/${ticket.clientId}`}
                  className="font-semibold text-foreground hover:text-primary underline transition-colors"
                >
                  {ticket.client.companyName}
                </Link>
              </span>

              {ticket.contact && (
                <span className="flex items-center gap-1">
                  <span>• Contact: </span>
                  <strong className="text-foreground font-medium">{ticket.contact.name}</strong>
                  {ticket.contact.phone && ` (${ticket.contact.phone})`}
                </span>
              )}

              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {formattedCreated} by {ticket.createdBy.name}</span>
              </span>
            </div>
          </div>

          {/* Inline Quick Action Controls */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border/70 shrink-0">
            {/* Quick Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Status
              </label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatusType)}
                disabled={statusLoading}
                className="h-8 px-2.5 text-xs font-semibold rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ticketStatuses.map((s) => (
                  <option key={s} value={s}>
                    {TICKET_STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Priority
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriorityType)}
                disabled={priorityLoading}
                className="h-8 px-2.5 text-xs font-semibold rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ticketPriorities.map((p) => (
                  <option key={p} value={p}>
                    {TICKET_PRIORITY_CONFIG[p].label} ({TICKET_PRIORITY_CONFIG[p].slaHours}h)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Reassign */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Assigned Agent
              </label>
              <select
                value={ticket.assignedToId || ''}
                onChange={(e) => handleReassign(e.target.value)}
                disabled={assignLoading}
                className="h-8 px-2.5 text-xs font-semibold rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring max-w-[160px] truncate"
              >
                <option value="">-- Unassigned --</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ticket Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Description
          </h3>
          <div className="bg-muted/20 border border-border/70 rounded-xl p-4 text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Reply Thread & Collaboration History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Activity & Replies ({replies.length})</span>
          </h3>
          <span className="text-xs text-muted-foreground">
            Internal notes are only visible to Pulse CRM staff
          </span>
        </div>

        {/* Thread list */}
        <div className="space-y-3">
          {replies.length === 0 ? (
            <div className="bg-card border border-dashed border-border/80 rounded-2xl p-8 text-center text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">No replies yet</p>
              <p>Be the first to post a public response or leave an internal collaboration note.</p>
            </div>
          ) : (
            replies.map((reply) => {
              const replyTime = new Date(reply.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={reply.id}
                  className={cn(
                    'rounded-2xl p-5 border transition-all text-xs space-y-2.5',
                    reply.isInternal
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 shadow-xs'
                      : 'bg-card border-border/80 shadow-xs'
                  )}
                >
                  {/* Reply Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                          reply.isInternal
                            ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {reply.author?.name ? reply.author.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-xs">
                            {reply.author?.name || 'Support Agent'}
                          </span>
                          {reply.author?.role && (
                            <span className="text-[10px] text-muted-foreground uppercase">
                              ({reply.author.role.replace('_', ' ')})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground block">{replyTime}</span>
                      </div>
                    </div>

                    {/* Badge: Internal Note vs Public Reply */}
                    <div>
                      {reply.isInternal ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          <Lock className="h-3 w-3" />
                          <span>Internal Note</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/60">
                          <span>Public Reply</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="text-foreground whitespace-pre-wrap leading-relaxed pl-9">
                    {reply.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Composer Form */}
        <form onSubmit={handleSendReply} className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Post a Reply or Note</span>
            {/* Internal Note Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-input text-amber-600 focus:ring-amber-500 h-4 w-4"
              />
              <span
                className={cn(
                  'font-semibold flex items-center gap-1 transition-colors',
                  isInternal ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                )}
              >
                <Lock className="h-3.5 w-3.5" />
                Internal note (not visible to client)
              </span>
            </label>
          </div>

          {replyError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {replyError}
            </div>
          )}

          <Textarea
            rows={3}
            placeholder={
              isInternal
                ? 'Write an internal note for team collaboration...'
                : 'Type customer response or update...'
            }
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            disabled={replyLoading}
            className={cn(
              'text-xs transition-colors',
              isInternal && 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
            )}
          />

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              disabled={replyLoading || !replyMessage.trim()}
              className={cn(
                'gap-2 text-xs',
                isInternal
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              )}
            >
              {replyLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{isInternal ? 'Add Internal Note' : 'Send Public Reply'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
