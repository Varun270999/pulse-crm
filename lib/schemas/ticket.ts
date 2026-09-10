import { z } from 'zod';

export const ticketStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
]);

export const ticketPrioritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const ticketCategorySchema = z.enum([
  'TECHNICAL',
  'BILLING',
  'GENERAL',
  'FEATURE_REQUEST',
  'OTHER',
]);

export const createTicketSchema = z.object({
  clientId: z.string().min(1, 'Please select a client.'),
  contactId: z.string().optional().nullable(),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters.'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters.'),
  priority: ticketPrioritySchema.default('MEDIUM'),
  category: ticketCategorySchema.default('GENERAL'),
  assignedToId: z.string().optional().nullable(),
});

export const updateTicketStatusSchema = z.object({
  id: z.string().min(1, 'Ticket ID is required.'),
  status: ticketStatusSchema,
});

export const updateTicketPrioritySchema = z.object({
  id: z.string().min(1, 'Ticket ID is required.'),
  priority: ticketPrioritySchema,
});

export const reassignTicketSchema = z.object({
  id: z.string().min(1, 'Ticket ID is required.'),
  assignedToId: z.string().optional().nullable(),
});

export const createTicketReplySchema = z.object({
  ticketId: z.string().min(1, 'Ticket ID is required.'),
  message: z.string().trim().min(1, 'Reply message cannot be empty.'),
  isInternal: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type UpdateTicketPriorityInput = z.infer<typeof updateTicketPrioritySchema>;
export type ReassignTicketInput = z.infer<typeof reassignTicketSchema>;
export type CreateTicketReplyInput = z.infer<typeof createTicketReplySchema>;
