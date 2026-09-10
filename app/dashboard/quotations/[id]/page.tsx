import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { PrintableDocumentView } from '@/components/invoices/printable-document-view';
import type { QuotationData, QuotationStatusType } from '@/types/billing';

export const metadata = {
  title: 'Quotation Details | Pulse CRM',
};

interface QuotationDetailPageProps {
  params: {
    id: string;
  };
}

export default async function QuotationDetailPage({ params }: QuotationDetailPageProps) {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);

  const qt = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      deal: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
      items: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!qt) {
    notFound();
  }

  // RBAC verification for sales rep
  if (
    session.user.role === 'SALES_EXECUTIVE' &&
    qt.createdById !== session.user.id &&
    qt.client.assignedToId !== session.user.id
  ) {
    notFound();
  }

  const serializedQuotation: QuotationData = {
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
  };

  return (
    <div className="py-2">
      <PrintableDocumentView type="quotation" document={serializedQuotation} />
    </div>
  );
}
