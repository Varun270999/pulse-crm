import { z } from 'zod';

const optionalEmail = z
  .string()
  .trim()
  .refine((val) => val === '' || z.string().email().safeParse(val).success, {
    message: 'Invalid email address format',
  });

const optionalUrl = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        const urlToTest = val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`;
        new URL(urlToTest);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid website URL' }
  );

export const clientRegistrationSchema = z.object({
  // Company Information
  companyName: z
    .string({ message: 'Company name is required' })
    .trim()
    .min(1, { message: 'Company name is required' }),
  industry: z.string().default(''),
  website: optionalUrl.default(''),
  email: optionalEmail.default(''),
  phone: z.string().default(''),

  // Address
  addressLine: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default('India'),

  // Primary Contact
  contactName: z
    .string({ message: 'Primary contact name is required' })
    .trim()
    .min(1, { message: 'Primary contact name is required' }),
  contactDesignation: z.string().default(''),
  contactEmail: optionalEmail.default(''),
  contactPhone: z.string().default(''),

  // Classification
  status: z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE']).default('PROSPECT'),
  source: z
    .enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'SOCIAL_MEDIA', 'EVENT', 'OTHER'])
    .default('OTHER'),
  notes: z.string().default(''),

  // Assignment
  assignedToId: z
    .string({ message: 'Please assign a sales representative' })
    .min(1, { message: 'Please assign a sales representative' }),
});

export const clientUpdateSchema = z.object({
  id: z.string().min(1, { message: 'Client ID is required' }),
  companyName: z
    .string({ message: 'Company name is required' })
    .trim()
    .min(1, { message: 'Company name is required' }),
  industry: z.string().default(''),
  website: optionalUrl.default(''),
  email: optionalEmail.default(''),
  phone: z.string().default(''),

  // Address
  addressLine: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default('India'),

  // Classification
  status: z.enum(['PROSPECT', 'ACTIVE', 'INACTIVE']).default('PROSPECT'),
  source: z
    .enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'SOCIAL_MEDIA', 'EVENT', 'OTHER'])
    .default('OTHER'),
  notes: z.string().default(''),

  // Assignment
  assignedToId: z
    .string({ message: 'Please assign a sales representative' })
    .min(1, { message: 'Please assign a sales representative' }),
});

export const addContactSchema = z.object({
  clientId: z.string().min(1, { message: 'Client ID is required' }),
  name: z
    .string({ message: 'Contact name is required' })
    .trim()
    .min(1, { message: 'Contact name is required' }),
  designation: z.string().default(''),
  email: optionalEmail.default(''),
  phone: z.string().default(''),
  isPrimary: z.boolean().default(false),
});

export type ClientRegistrationInput = z.input<typeof clientRegistrationSchema>;
export type ClientRegistrationOutput = z.output<typeof clientRegistrationSchema>;

export type ClientUpdateInput = z.input<typeof clientUpdateSchema>;
export type ClientUpdateOutput = z.output<typeof clientUpdateSchema>;

export type AddContactInput = z.input<typeof addContactSchema>;
export type AddContactOutput = z.output<typeof addContactSchema>;
