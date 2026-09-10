import { z } from 'zod';

export const userRoleEnum = z.enum([
  'ADMIN',
  'MANAGER',
  'SALES_EXECUTIVE',
  'SUPPORT_AGENT',
]);

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  role: userRoleEnum,
  department: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  joiningDate: z.string().optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  id: z.string().uuid('Invalid employee ID'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().toLowerCase().email('Invalid email address format'),
  role: userRoleEnum,
  department: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  joiningDate: z.string().optional().nullable(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const toggleEmployeeStatusSchema = z.object({
  id: z.string().uuid('Invalid employee ID'),
  isActive: z.boolean(),
});

export type ToggleEmployeeStatusInput = z.infer<typeof toggleEmployeeStatusSchema>;

export const resetEmployeePasswordSchema = z.object({
  id: z.string().uuid('Invalid employee ID'),
});

export type ResetEmployeePasswordInput = z.infer<typeof resetEmployeePasswordSchema>;
