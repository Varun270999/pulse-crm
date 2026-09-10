import { z } from 'zod';

export const dealStages = [
  'NEW',
  'QUALIFICATION',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;

export const dealCaptureSchema = z.object({
  title: z
    .string({ message: 'Deal title is required' })
    .trim()
    .min(1, { message: 'Deal title is required' }),
  clientId: z
    .string({ message: 'Please select a client' })
    .min(1, { message: 'Please select a client' }),
  value: z
    .string({ message: 'Deal value is required' })
    .min(1, { message: 'Deal value is required' })
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      { message: 'Deal value must be a positive number greater than 0' }
    ),
  stage: z.enum(dealStages).default('NEW'),
  probability: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine(
      (val) => !isNaN(val) && val >= 0 && val <= 100,
      { message: 'Probability must be between 0 and 100' }
    )
    .default(10),
  expectedCloseDate: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  assignedToId: z
    .string({ message: 'Please assign a sales representative' })
    .min(1, { message: 'Please assign a sales representative' }),
});

export const dealStageUpdateSchema = z
  .object({
    dealId: z.string().min(1, { message: 'Deal ID is required' }),
    stage: z.enum(dealStages),
    probability: z
      .union([z.number(), z.string()])
      .optional()
      .transform((val) => (val !== undefined && val !== '' ? Number(val) : undefined)),
    lostReason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.stage === 'LOST') {
        return !!data.lostReason && data.lostReason.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please provide a reason why this deal was lost',
      path: ['lostReason'],
    }
  );

export const dealUpdateSchema = z
  .object({
    id: z.string().min(1, { message: 'Deal ID is required' }),
    title: z
      .string({ message: 'Deal title is required' })
      .trim()
      .min(1, { message: 'Deal title is required' }),
    clientId: z
      .string({ message: 'Please select a client' })
      .min(1, { message: 'Please select a client' }),
    value: z
      .string({ message: 'Deal value is required' })
      .min(1, { message: 'Deal value is required' })
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) > 0,
        { message: 'Deal value must be a positive number greater than 0' }
      ),
    stage: z.enum(dealStages),
    probability: z
      .union([z.number(), z.string()])
      .transform((val) => Number(val))
      .refine(
        (val) => !isNaN(val) && val >= 0 && val <= 100,
        { message: 'Probability must be between 0 and 100' }
      ),
    expectedCloseDate: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    lostReason: z.string().optional(),
    assignedToId: z
      .string({ message: 'Please assign a sales representative' })
      .min(1, { message: 'Please assign a sales representative' }),
  })
  .refine(
    (data) => {
      if (data.stage === 'LOST') {
        return !!data.lostReason && data.lostReason.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Please provide a reason why this deal was lost',
      path: ['lostReason'],
    }
  );

export type DealCaptureInput = z.input<typeof dealCaptureSchema>;
export type DealCaptureOutput = z.output<typeof dealCaptureSchema>;
export type DealStageUpdateInput = z.input<typeof dealStageUpdateSchema>;
export type DealUpdateInput = z.input<typeof dealUpdateSchema>;
