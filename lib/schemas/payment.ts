import { z } from 'zod';

export const paymentMethodSchema = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'UPI',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CHEQUE',
  'OTHER',
]);

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Please select an invoice.'),
  amount: z
    .number({ message: 'Amount must be a number.' })
    .positive('Payment amount must be greater than 0.'),
  paymentMethod: paymentMethodSchema,
  paymentDate: z.string().optional(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePaymentSchema = z.object({
  id: z.string().min(1, 'Payment ID is required.'),
  amount: z
    .number({ message: 'Amount must be a number.' })
    .positive('Payment amount must be greater than 0.'),
  paymentMethod: paymentMethodSchema,
  paymentDate: z.string().optional(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const deletePaymentSchema = z.object({
  id: z.string().min(1, 'Payment ID is required.'),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type DeletePaymentInput = z.infer<typeof deletePaymentSchema>;
