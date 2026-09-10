import { notFound } from 'next/navigation';
import { requireRole, type UserRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { PrintableDocumentView } from '@/components/invoices/printable-document-view';
import type { InvoiceData, InvoiceStatusType } from '@/types/billing';

export const metadata = {
  title: 'Invoice Details | Pulse CRM',
};

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);

  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      deal: { select: { id: true, title: true } },
      quotation: { select: { id: true, quotationNumber: true } },
      createdBy: { select: { id: true, name: true } },
      items: { orderBy: { sortOrder: 'asc' } },
      payments: {
        include: {
          recordedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!inv) {
    notFound();
  }

  // RBAC verification for sales rep
  if (
    session.user.role === 'SALES_EXECUTIVE' &&
    inv.createdById !== session.user.id &&
    inv.client.assignedToId !== session.user.id
  ) {
    notFound();
  }

  const serializedInvoice: InvoiceData = {
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
    payments: inv.payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      invoiceId: p.invoiceId,
      clientId: p.clientId,
      amount: Number(p.amount),
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate.toISOString(),
      referenceNumber: p.referenceNumber,
      notes: p.notes,
      recordedById: p.recordedById,
      createdAt: p.createdAt.toISOString(),
      recordedBy: p.recordedBy,
    })),
  };

  return (
    <div className="py-2">
      <PrintableDocumentView
        type="invoice"
        document={serializedInvoice}
        userRole={session.user.role as UserRole}
      />
    </div>
  );
}
