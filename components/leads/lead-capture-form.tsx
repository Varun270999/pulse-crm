'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  leadCaptureSchema,
  type LeadCaptureInput,
} from '@/lib/schemas/lead';
import { createLeadAction } from '@/app/actions/leads';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  User,
  IndianRupee,
  UserCog,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesRepOption {
  id: string;
  name: string;
  role: string;
}

interface LeadCaptureFormProps {
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  salesReps: SalesRepOption[];
}

export function LeadCaptureForm({
  currentUser,
  salesReps,
}: LeadCaptureFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSalesExecutive = currentUser.role === 'SALES_EXECUTIVE';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadCaptureInput>({
    resolver: zodResolver(leadCaptureSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
      phone: '',
      source: 'OTHER',
      estimatedValue: '',
      notes: '',
      assignedToId: isSalesExecutive ? currentUser.id : (salesReps[0]?.id || currentUser.id),
    },
  });

  const onSubmit = async (data: LeadCaptureInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await createLeadAction(data);

      if (result.error) {
        setServerError(result.error);
        setIsSubmitting(false);
      } else if (result.success) {
        router.push('/dashboard/leads?success=created');
        router.refresh();
      }
    } catch {
      setServerError('A network error occurred. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-gray-900';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl pb-12">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/leads" className="hover:text-blue-600 transition-colors">
              Leads
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-800">New Lead</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Add New Lead
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Capture lead prospect details, potential deal value, and assign account ownership.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/leads"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex items-center gap-1.5')}
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>
        </div>
      </div>

      {/* Global Server Error Banner */}
      {serverError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}

      {/* Section 1: Lead & Contact Information */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <User className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              1. Lead & Contact Information
            </CardTitle>
          </div>
          <CardDescription>Primary stakeholder name and contact coordinates</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Lead / Contact Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Vikram Malhotra"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company / Organization</Label>
            <div className="relative">
              <Input
                id="companyName"
                placeholder="e.g. Apex Tech Solutions"
                {...register('companyName')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="vikram@apextech.in"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone / Mobile Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 12345"
              {...register('phone')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Deal Sizing & Source */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <IndianRupee className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              2. Deal Valuation & Source
            </CardTitle>
          </div>
          <CardDescription>Estimated business value and lead acquisition channel</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="estimatedValue">Estimated Deal Value (₹ INR)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                ₹
              </span>
              <Input
                id="estimatedValue"
                type="number"
                step="0.01"
                min="0"
                className="pl-8"
                placeholder="e.g. 250000"
                {...register('estimatedValue')}
                disabled={isSubmitting}
              />
            </div>
            {errors.estimatedValue && (
              <p className="text-xs text-red-500 font-medium">{errors.estimatedValue.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Lead Acquisition Source</Label>
            <select id="source" className={selectClassName} {...register('source')} disabled={isSubmitting}>
              <option value="WEBSITE">Website Inbound</option>
              <option value="REFERRAL">Client Referral</option>
              <option value="COLD_CALL">Outbound / Cold Call</option>
              <option value="SOCIAL_MEDIA">Social Media / LinkedIn</option>
              <option value="EVENT">Conference / Trade Event</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Notes & Discovery Context</Label>
            <Textarea
              id="notes"
              placeholder="Requirement summary, budget availability, decision-making timeline, initial notes..."
              rows={3}
              {...register('notes')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Sales Rep Assignment */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <UserCog className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              3. Sales Representative Assignment
            </CardTitle>
          </div>
          <CardDescription>Designate the account owner responsible for pursuing this deal</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isSalesExecutive ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Lead Ownership
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  Assigned to you: {currentUser.name || 'Sales Executive'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  As a Sales Executive, leads you capture are automatically assigned to your pipeline.
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Self-Assigned
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-w-md">
              <Label htmlFor="assignedToId">
                Select Sales Representative <span className="text-red-500">*</span>
              </Label>
              <select
                id="assignedToId"
                className={selectClassName}
                {...register('assignedToId')}
                disabled={isSubmitting}
              >
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name} ({rep.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
              {errors.assignedToId && (
                <p className="text-xs text-red-500 font-medium">{errors.assignedToId.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Select an active sales executive or manager from your team.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/leads"
          className={buttonVariants({ variant: 'outline' })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Lead...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Create Lead
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
