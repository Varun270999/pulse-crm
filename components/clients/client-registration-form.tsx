'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  clientRegistrationSchema,
  type ClientRegistrationInput,
} from '@/lib/schemas/client';
import { createClientAction } from '@/app/actions/clients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  UserCheck,
  Tag,
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

interface ClientRegistrationFormProps {
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  salesReps: SalesRepOption[];
}

export function ClientRegistrationForm({
  currentUser,
  salesReps,
}: ClientRegistrationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSalesExecutive = currentUser.role === 'SALES_EXECUTIVE';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientRegistrationInput>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      companyName: '',
      industry: '',
      website: '',
      email: '',
      phone: '',
      addressLine: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      contactName: '',
      contactDesignation: '',
      contactEmail: '',
      contactPhone: '',
      status: 'PROSPECT',
      source: 'OTHER',
      notes: '',
      assignedToId: isSalesExecutive ? currentUser.id : (salesReps[0]?.id || currentUser.id),
    },
  });

  const onSubmit = async (data: ClientRegistrationInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await createClientAction(data);

      if (result.error) {
        setServerError(result.error);
        setIsSubmitting(false);
      } else if (result.success) {
        router.push('/dashboard/clients?success=created');
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
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/clients" className="hover:text-blue-600 transition-colors">
              Clients
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-800">New Client</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Register New Client
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Add a new company profile, primary point of contact, and assign a sales representative.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/clients"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex items-center gap-1.5')}
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Link>
        </div>
      </div>

      {/* Global Error Banner */}
      {serverError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}

      {/* Section 1: Company Information */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <Building2 className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              1. Company Information
            </CardTitle>
          </div>
          <CardDescription>Primary organization details and business identifiers</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="e.g. Acme Innovations Pvt Ltd"
              {...register('companyName')}
              disabled={isSubmitting}
            />
            {errors.companyName && (
              <p className="text-xs text-red-500 font-medium">{errors.companyName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Information Technology, Healthcare"
              {...register('industry')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://example.com"
              {...register('website')}
              disabled={isSubmitting}
            />
            {errors.website && (
              <p className="text-xs text-red-500 font-medium">{errors.website.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Company Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@company.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Company Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              {...register('phone')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Address Details */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <MapPin className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              2. Address & Location
            </CardTitle>
          </div>
          <CardDescription>Physical headquarters or billing address</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addressLine">Street Address</Label>
            <Input
              id="addressLine"
              placeholder="Suite 400, Silicon Tech Park"
              {...register('addressLine')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. Bengaluru"
              {...register('city')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="state">State / Province</Label>
            <Input
              id="state"
              placeholder="e.g. Karnataka"
              {...register('state')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="postalCode">Postal / Zip Code</Label>
            <Input
              id="postalCode"
              placeholder="e.g. 560100"
              {...register('postalCode')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              defaultValue="India"
              {...register('country')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Primary Contact Person */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <UserCheck className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              3. Primary Contact Person
            </CardTitle>
          </div>
          <CardDescription>
            Key stakeholder or decision-maker (automatically saved as the primary contact)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contactName">
              Contact Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactName"
              placeholder="e.g. Rajesh Sharma"
              {...register('contactName')}
              disabled={isSubmitting}
            />
            {errors.contactName && (
              <p className="text-xs text-red-500 font-medium">{errors.contactName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactDesignation">Designation / Title</Label>
            <Input
              id="contactDesignation"
              placeholder="e.g. VP of Operations / CTO"
              {...register('contactDesignation')}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="rajesh@company.com"
              {...register('contactEmail')}
              disabled={isSubmitting}
            />
            {errors.contactEmail && (
              <p className="text-xs text-red-500 font-medium">{errors.contactEmail.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Direct Phone / Mobile</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+91 99887 76655"
              {...register('contactPhone')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Classification & Notes */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <Tag className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              4. Classification & Notes
            </CardTitle>
          </div>
          <CardDescription>Lifecycle stage and acquisition channel</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Client Status</Label>
            <select id="status" className={selectClassName} {...register('status')} disabled={isSubmitting}>
              <option value="PROSPECT">Prospect (Evaluating / In discussions)</option>
              <option value="ACTIVE">Active (Existing customer)</option>
              <option value="INACTIVE">Inactive (Dormant / Lost)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">Lead Source</Label>
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
            <Label htmlFor="notes">Account Notes & Background</Label>
            <Textarea
              id="notes"
              placeholder="Key business pain points, timeline, budget expectations, or relevant background information..."
              rows={3}
              {...register('notes')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Sales Representative Assignment */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <UserCog className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              5. Sales Representative Assignment
            </CardTitle>
          </div>
          <CardDescription>
            Assign account ownership to an active sales manager or executive
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isSalesExecutive ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Account Ownership
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  Assigned to you: {currentUser.name || 'Sales Executive'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  As a Sales Executive, clients you register are automatically assigned to your portfolio.
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
                Available sales executives and managers with active status.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/clients"
          className={buttonVariants({ variant: 'outline' })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Client...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Register Client
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
