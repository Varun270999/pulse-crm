import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { BillingViewContainer } from '@/components/invoices/billing-view-container';
import type {
  InvoiceData,
  QuotationData,
  BillingStats,
  InvoiceStatusType,
  QuotationStatusType,
} from '@/types/billing';
import type { Prisma } from '@prisma/client';

export const metadata = {
  title: 'Quotations & Invoices | Pulse CRM',
};

export default async function InvoicesPage() {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);
  const userRole = session.user.role;

  // Filter conditions for sales rep
  const invoiceWhere: Prisma.InvoiceWhereInput = {};
  const quotationWhere: Prisma.QuotationWhereInput = {};

  if (userRole === 'SALES_EXECUTIVE') {
    invoiceWhere.OR = [
      { createdById: session.user.id },
      { client: { assignedToId: session.user.id } },
    ];
    quotationWhere.OR = [
      { createdById: session.user.id },
      { client: { assignedToId: session.user.id } },
    ];
  }

  // Fetch Invoices and Quotations concurrently in parallel
  const [rawInvoices, rawQuotations] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        client: true,
        quotation: { select: { id: true, quotationNumber: true } },
        deal: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.quotation.findMany({
      where: quotationWhere,
      include: {
        client: true,
        deal: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Calculate Billing Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let totalInvoiced = 0;
  let totalOutstanding = 0;
  let collectedThisMonth = 0;
  let overdueInvoicesCount = 0;
  let overdueInvoicesAmount = 0;

  rawInvoices.forEach((inv) => {
    const total = Number(inv.totalAmount);
    const paid = Number(inv.paidAmount);
    const balance = Math.max(0, total - paid);

    if (inv.status !== 'CANCELLED') {
      totalInvoiced += total;
    }

    if (['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status)) {
      totalOutstanding += balance;
    }

    // Collected this month
    if (inv.updatedAt >= startOfMonth && paid > 0) {
      collectedThisMonth += paid;
    }

    // Overdue
    if (inv.dueDate < today && inv.status !== 'PAID' && inv.status !== 'CANCELLED') {
      overdueInvoicesCount += 1;
      overdueInvoicesAmount += balance;
    }
  });

  let activeQuotationsCount = 0;
  let activeQuotationsValue = 0;

  rawQuotations.forEach((qt) => {
    if (['DRAFT', 'SENT'].includes(qt.status)) {
      activeQuotationsCount += 1;
      activeQuotationsValue += Number(qt.totalAmount);
    }
  });

  const stats: BillingStats = {
    totalInvoiced: Math.round(totalInvoiced),
    totalOutstanding: Math.round(totalOutstanding),
    collectedThisMonth: Math.round(collectedThisMonth),
    overdueInvoicesCount,
    overdueInvoicesAmount: Math.round(overdueInvoicesAmount),
    activeQuotationsCount,
    activeQuotationsValue: Math.round(activeQuotationsValue),
  };

  // Serialize Invoices
  const serializedInvoices: InvoiceData[] = rawInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientId: inv.clientId,
    quotationId: inv.quotationId,
    dealId: inv.dealId,
    status: inv.status as InvoiceStatusType,
    issueDate: inv.issueDate.toISOString(),
    dueDate: inv.dueDate.toISOString(),
    subtotal: Number(inv.subtotal),
    taxPercent: Number(inv.taxPercent),
    taxAmount: Number(inv.taxAmount),
    discountPercent: Number(inv.discountPercent),
    discountAmount: Number(inv.discountAmount),
    totalAmount: Number(inv.totalAmount),
    paidAmount: Number(inv.paidAmount),
    notes: inv.notes,
    termsAndConditions: inv.termsAndConditions,
    createdById: inv.createdById,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
    client: {
      id: inv.client.id,
      companyName: inv.client.companyName,
      email: inv.client.email,
      phone: inv.client.phone,
      addressLine: inv.client.addressLine,
      city: inv.client.city,
      state: inv.client.state,
      postalCode: inv.client.postalCode,
      country: inv.client.country,
    },
    quotation: inv.quotation,
    deal: inv.deal,
    createdBy: inv.createdBy,
    items: inv.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      amount: Number(it.amount),
      sortOrder: it.sortOrder,
    })),
  }));

  // Serialize Quotations
  const serializedQuotations: QuotationData[] = rawQuotations.map((qt) => ({
    id: qt.id,
    quotationNumber: qt.quotationNumber,
    clientId: qt.clientId,
    dealId: qt.dealId,
    status: qt.status as QuotationStatusType,
    issueDate: qt.issueDate.toISOString(),
    validUntil: qt.validUntil ? qt.validUntil.toISOString() : null,
    subtotal: Number(qt.subtotal),
    taxPercent: Number(qt.taxPercent),
    taxAmount: Number(qt.taxAmount),
    discountPercent: Number(qt.discountPercent),
    discountAmount: Number(qt.discountAmount),
    totalAmount: Number(qt.totalAmount),
    notes: qt.notes,
    termsAndConditions: qt.termsAndConditions,
    createdById: qt.createdById,
    createdAt: qt.createdAt.toISOString(),
    updatedAt: qt.updatedAt.toISOString(),
    client: {
      id: qt.client.id,
      companyName: qt.client.companyName,
      email: qt.client.email,
      phone: qt.client.phone,
      addressLine: qt.client.addressLine,
      city: qt.client.city,
      state: qt.client.state,
      postalCode: qt.client.postalCode,
      country: qt.client.country,
    },
    deal: qt.deal,
    createdBy: qt.createdBy,
    items: qt.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
      amount: Number(it.amount),
      sortOrder: it.sortOrder,
    })),
  }));

  return (
    <div className="py-2">
      <BillingViewContainer
        initialInvoices={serializedInvoices}
        initialQuotations={serializedQuotations}
        stats={stats}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        }}
      />
    </div>
  );
}
