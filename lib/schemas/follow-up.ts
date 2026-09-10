import { z } from 'zod';

export const followUpTypes = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'OTHER'] as const;
export const followUpStatuses = ['PENDING', 'COMPLETED', 'CANCELLED'] as const;
export const recurrencePatterns = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
export const relatedTypes = ['NONE', 'LEAD', 'CLIENT'] as const;

export const followUpSchema = z
  .object({
    title: z
      .string({ message: 'Title is required' })
      .trim()
      .min(1, { message: 'Title is required' }),
    description: z.string().default(''),
    type: z.enum(followUpTypes).default('TASK'),
    dueDate: z
      .string({ message: 'Due date and time are required' })
      .min(1, { message: 'Due date and time are required' })
      .refine(
        (val) => !isNaN(new Date(val).getTime()),
        { message: 'Invalid date format' }
      ),
    relatedType: z.enum(relatedTypes).default('NONE'),
    leadId: z.string().default(''),
    clientId: z.string().default(''),
    assignedToId: z
      .string({ message: 'Please assign a team member' })
      .min(1, { message: 'Please assign a team member' }),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z.enum(recurrencePatterns).optional(),
  })
  .refine(
    (data) => {
      if (data.relatedType === 'LEAD') {
        return Boolean(data.leadId && data.leadId.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Please select a related Lead',
      path: ['leadId'],
    }
  )
  .refine(
    (data) => {
      if (data.relatedType === 'CLIENT') {
        return Boolean(data.clientId && data.clientId.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Please select a related Client',
      path: ['clientId'],
    }
  )
  .refine(
    (data) => {
      if (data.isRecurring) {
        return Boolean(data.recurrencePattern);
      }
      return true;
    },
    {
      message: 'Please select a recurrence interval',
      path: ['recurrencePattern'],
    }
  );

export const quickFollowUpSchema = z
  .object({
    title: z
      .string({ message: 'Title is required' })
      .trim()
      .min(1, { message: 'Title is required' }),
    description: z.string().default(''),
    type: z.enum(followUpTypes).default('TASK'),
    dueDate: z
      .string({ message: 'Due date and time are required' })
      .min(1, { message: 'Due date and time are required' })
      .refine(
        (val) => !isNaN(new Date(val).getTime()),
        { message: 'Invalid date format' }
      ),
    leadId: z.string().optional(),
    clientId: z.string().optional(),
    assignedToId: z.string().min(1, { message: 'Assignee is required' }),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z.enum(recurrencePatterns).optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return Boolean(data.recurrencePattern);
      }
      return true;
    },
    {
      message: 'Please select a recurrence interval',
      path: ['recurrencePattern'],
    }
  );

export type FollowUpInput = z.input<typeof followUpSchema>;
export type QuickFollowUpInput = z.input<typeof quickFollowUpSchema>;
