import { z } from 'zod';

const optionalEmail = z
  .string()
  .trim()
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Invalid email address format',
  });

export const leadSources = [
  'WEBSITE',
  'REFERRAL',
  'COLD_CALL',
  'SOCIAL_MEDIA',
  'EVENT',
  'OTHER',
] as const;

export const leadStatuses = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'CONVERTED',
  'LOST',
] as const;

export const leadCaptureSchema = z.object({
  name: z
    .string({ message: 'Lead name is required' })
    .trim()
    .min(1, { message: 'Lead name is required' }),
  companyName: z.string().default(''),
  email: optionalEmail.default(''),
  phone: z.string().default(''),
  source: z.enum(leadSources).default('OTHER'),
  estimatedValue: z
    .string()
    .default('')
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      { message: 'Estimated value must be a positive number' }
    ),
  notes: z.string().default(''),
  assignedToId: z
    .string({ message: 'Please assign a sales representative' })
    .min(1, { message: 'Please assign a sales representative' }),
});

export const leadStatusUpdateSchema = z.object({
  leadId: z.string().min(1, { message: 'Lead ID is required' }),
  status: z.enum(leadStatuses),
  lostReason: z.string().optional(),
}).refine(
  (data) => {
    if (data.status === 'LOST') {
      return !!data.lostReason && data.lostReason.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Please provide a reason why this lead was lost',
    path: ['lostReason'],
  }
);

export const leadUpdateSchema = z.object({
  id: z.string().min(1, { message: 'Lead ID is required' }),
  name: z
    .string({ message: 'Lead name is required' })
    .trim()
    .min(1, { message: 'Lead name is required' }),
  companyName: z.string().default(''),
  email: optionalEmail.default(''),
  phone: z.string().default(''),
  source: z.enum(leadSources).default('OTHER'),
  estimatedValue: z
    .string()
    .default('')
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      { message: 'Estimated value must be a positive number' }
    ),
  notes: z.string().default(''),
  assignedToId: z
    .string({ message: 'Please assign a sales representative' })
    .min(1, { message: 'Please assign a sales representative' }),
});

export type LeadCaptureInput = z.input<typeof leadCaptureSchema>;
export type LeadCaptureOutput = z.output<typeof leadCaptureSchema>;

export type LeadStatusUpdateInput = z.input<typeof leadStatusUpdateSchema>;
export type LeadUpdateInput = z.input<typeof leadUpdateSchema>;
