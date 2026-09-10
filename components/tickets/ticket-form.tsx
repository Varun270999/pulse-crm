'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createTicketAction, getClientContactsAction } from '@/app/actions/tickets';
import {
  ticketPriorities,
  ticketCategories,
  TICKET_PRIORITY_CONFIG,
  TICKET_CATEGORY_CONFIG,
  type TicketPriorityType,
  type TicketCategoryType,
} from '@/types/ticket';
import {
  LifeBuoy,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export interface ClientOption {
  id: string;
  companyName: string;
}

export interface AgentOption {
  id: string;
  name: string;
  role: string;
}

export interface ContactOption {
  id: string;
  name: string;
  designation?: string | null;
  email?: string | null;
  isPrimary?: boolean;
}

interface TicketFormProps {
  clients: ClientOption[];
  agents: AgentOption[];
  preselectedClientId?: string;
}

export function TicketForm({
  clients,
  agents,
  preselectedClientId,
}: TicketFormProps) {
  const router = useRouter();

  const [clientId, setClientId] = useState<string>(
    preselectedClientId || (clients.length > 0 ? clients[0].id : '')
  );
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [contactId, setContactId] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<TicketPriorityType>('MEDIUM');
  const [category, setCategory] = useState<TicketCategoryType>('GENERAL');
  const [assignedToId, setAssignedToId] = useState<string>('');

  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load contacts whenever clientId changes
  useEffect(() => {
    if (!clientId) {
      setContacts([]);
      setContactId('');
      return;
    }

    let isMounted = true;
    setLoadingContacts(true);

    getClientContactsAction(clientId)
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.contacts || [];
        setContacts(fetched);
        // Default to primary contact if available
        const primary = fetched.find((c) => c.isPrimary);
        if (primary) {
          setContactId(primary.id);
        } else if (fetched.length > 0) {
          setContactId(fetched[0].id);
        } else {
          setContactId('');
        }
      })
      .finally(() => {
        if (isMounted) setLoadingContacts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!clientId) {
      setError('Please select a client.');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createTicketAction({
        clientId,
        contactId: contactId || undefined,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
        assignedToId: assignedToId || undefined,
      });

      if (res.error) {
        setError(res.error);
        setSubmitting(false);
      } else if (res.ticketId) {
        router.push(`/dashboard/tickets/${res.ticketId}`);
      } else {
        router.push('/dashboard/tickets');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create support ticket.';
      setError(msg);
      setSubmitting(false);
    }
  }

  const priorityConfig = TICKET_PRIORITY_CONFIG[priority];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/tickets"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 text-xs')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tickets</span>
        </Link>
        <span className="text-xs text-muted-foreground">Pulse CRM Help Desk</span>
      </div>

      <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600">
              <LifeBuoy className="h-5 w-5" />
            </div>
            Create Support Ticket
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Log a new service inquiry or technical issue with SLA resolution tracking.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Client & Contact Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="client-select" className="text-xs font-semibold">
              Client Account <span className="text-rose-500">*</span>
            </Label>
            <select
              id="client-select"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                if (error) setError(null);
              }}
              disabled={submitting}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-select" className="text-xs font-semibold">
              Client Contact Person (Optional)
            </Label>
            <select
              id="contact-select"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              disabled={submitting || loadingContacts}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">-- No specific contact / General --</option>
              {contacts.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} {ct.designation ? `(${ct.designation})` : ''} {ct.isPrimary ? '★ Primary' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <Label htmlFor="ticket-subject" className="text-xs font-semibold">
            Subject <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="ticket-subject"
            type="text"
            placeholder="e.g. Production database latency spikes during checkout"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              if (error) setError(null);
            }}
            disabled={submitting}
            className="h-10 text-sm font-medium"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-category" className="text-xs font-semibold">
              Category <span className="text-rose-500">*</span>
            </Label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategoryType)}
              disabled={submitting}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ticketCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {TICKET_CATEGORY_CONFIG[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-priority" className="text-xs font-semibold">
              Priority <span className="text-rose-500">*</span>
            </Label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriorityType)}
              disabled={submitting}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {ticketPriorities.map((pr) => (
                <option key={pr} value={pr}>
                  {TICKET_PRIORITY_CONFIG[pr].label} ({TICKET_PRIORITY_CONFIG[pr].slaHours}h SLA)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SLA Information Notice */}
        <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              Target Resolution SLA for <strong className="text-foreground">{priorityConfig.label}</strong> priority:
            </span>
          </div>
          <span className="font-bold text-foreground font-mono">
            {priorityConfig.slaHours} hours from creation
          </span>
        </div>

        {/* Assigned Agent */}
        <div className="space-y-1.5">
          <Label htmlFor="ticket-assigned" className="text-xs font-semibold">
            Assign Support Agent (Optional)
          </Label>
          <select
            id="ticket-assigned"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            disabled={submitting}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">-- Unassigned (Escalation Queue) --</option>
            {agents.map((ag) => (
              <option key={ag.id} value={ag.id}>
                {ag.name} ({ag.role.replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="ticket-description" className="text-xs font-semibold">
            Ticket Details & Steps to Reproduce <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            id="ticket-description"
            rows={5}
            placeholder="Provide comprehensive details about the customer's request, error messages, affected systems..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError(null);
            }}
            disabled={submitting}
            className="text-xs leading-relaxed"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
          <Link
            href="/dashboard/tickets"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={submitting || !subject.trim() || !description.trim() || !clientId}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Ticket...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Submit Ticket</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
