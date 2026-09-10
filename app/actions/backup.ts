'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { executeAction } from '@/lib/actionWrapper';
import { logActivity } from '@/lib/activityLog';

export interface BackupSummary {
  clients: number;
  contacts: number;
  leads: number;
  deals: number;
  invoices: number;
  payments: number;
  supportTickets: number;
  followUps: number;
}

/**
 * Dumps all core database tables into a structured JSON string for backup (ADMIN only).
 */
export async function exportAllDataAction() {
  return executeAction('exportAllDataAction', async () => {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized: Only administrators can export system data.' };
    }

    const [
      clients,
      contacts,
      leads,
      deals,
      invoices,
      payments,
      supportTickets,
      followUps,
    ] = await Promise.all([
      prisma.client.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.contact.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.deal.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.invoice.findMany({
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.supportTicket.findMany({
        include: { replies: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.followUp.findMany({
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const summary: BackupSummary = {
      clients: clients.length,
      contacts: contacts.length,
      leads: leads.length,
      deals: deals.length,
      invoices: invoices.length,
      payments: payments.length,
      supportTickets: supportTickets.length,
      followUps: followUps.length,
    };

    const backupPayload = {
      metadata: {
        system: 'Pulse CRM',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportedBy: `${session.user.name || 'Admin'} (${session.user.email})`,
        summary,
      },
      data: {
        clients,
        contacts,
        leads,
        deals,
        invoices,
        payments,
        supportTickets,
        followUps,
      },
    };

    logActivity({
      userId: session.user.id,
      action: 'DATA_EXPORTED',
      description: `Exported full database backup (${summary.clients} clients, ${summary.deals} deals, ${summary.invoices} invoices, ${summary.payments} payments)`,
    });

    return {
      success: true,
      summary,
      jsonString: JSON.stringify(backupPayload, null, 2),
      filename: `pulse-crm-backup-${new Date().toISOString().split('T')[0]}.json`,
    };
  });
}
