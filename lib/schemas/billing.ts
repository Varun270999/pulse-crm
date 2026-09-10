import { z } from 'zod';

export const quotationStatuses = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
] as const;

export const invoiceStatuses = [
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;

export const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z
    .string({ message: 'Line item description is required' })
    .trim()
    .min(1, { message: 'Line item description is required' }),
  quantity: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, {
      message: 'Quantity must be greater than 0',
    }),
  unitPrice: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v >= 0, {
      message: 'Unit price must be 0 or greater',
    }),
});

export const quotationSchema = z.object({
  clientId: z
    .string({ message: 'Please select a client' })
    .min(1, { message: 'Please select a client' }),
  dealId: z.string().optional().default(''),
  issueDate: z.string().min(1, { message: 'Issue date is required' }),
  validUntil: z.string().optional().default(''),
  taxPercent: z
    .union([z.number(), z.string()])
    .transform((v) => (v === '' ? 0 : Number(v)))
    .refine((v) => !isNaN(v) && v >= 0 && v <= 100, {
      message: 'Tax percent must be between 0 and 100',
    })
    .default(0),
  discountPercent: z
    .union([z.number(), z.string()])
    .transform((v) => (v === '' ? 0 : Number(v)))
    .refine((v) => !isNaN(v) && v >= 0 && v <= 100, {
      message: 'Discount percent must be between 0 and 100',
    })
    .default(0),
  notes: z.string().optional().default(''),
  termsAndConditions: z.string().optional().default(''),
  items: z
    .array(lineItemSchema)
    .min(1, { message: 'At least one line item is required' }),
});

export const invoiceSchema = z.object({
  clientId: z
    .string({ message: 'Please select a client' })
    .min(1, { message: 'Please select a client' }),
  quotationId: z.string().optional().default(''),
  dealId: z.string().optional().default(''),
  issueDate: z.string().min(1, { message: 'Issue date is required' }),
  dueDate: z.string().min(1, { message: 'Due date is required' }),
  taxPercent: z
    .union([z.number(), z.string()])
    .transform((v) => (v === '' ? 0 : Number(v)))
    .refine((v) => !isNaN(v) && v >= 0 && v <= 100, {
      message: 'Tax percent must be between 0 and 100',
    })
    .default(0),
  discountPercent: z
    .union([z.number(), z.string()])
    .transform((v) => (v === '' ? 0 : Number(v)))
    .refine((v) => !isNaN(v) && v >= 0 && v <= 100, {
      message: 'Discount percent must be between 0 and 100',
    })
    .default(0),
  notes: z.string().optional().default(''),
  termsAndConditions: z.string().optional().default(''),
  items: z
    .array(lineItemSchema)
    .min(1, { message: 'At least one line item is required' }),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, { message: 'Invoice ID is required' }),
  amount: z
    .union([z.number(), z.string()])
    .transform((v) => Number(v))
    .refine((v) => !isNaN(v) && v > 0, {
      message: 'Payment amount must be greater than 0',
    }),
  notes: z.string().optional().default(''),
});

export type LineItemInput = z.input<typeof lineItemSchema>;
export type QuotationInput = z.input<typeof quotationSchema>;
export type InvoiceInput = z.input<typeof invoiceSchema>;
export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;
