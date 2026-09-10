'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  followUpSchema,
  type FollowUpInput,
} from '@/lib/schemas/follow-up';
import type { FollowUpType } from '@/types/follow-up';
import { createFollowUpAction } from '@/app/actions/follow-ups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  PhoneCall,
  Mail,
  CalendarDays,
  CheckSquare,
  Clock,
  UserCheck,
  Building2,
  Repeat,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptionItem {
  id: string;
  name: string;
  subtitle?: string | null;
}

interface SalesRepOption {
  id: string;
  name: string;
  role: string;
}

interface FollowUpFormProps {
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  salesReps: SalesRepOption[];
  leads: OptionItem[];
  clients: OptionItem[];
  defaultValues?: Partial<FollowUpInput>;
}

// Get local ISO string for datetime-local default (e.g., 2 hours from now)
function getDefaultDateTimeString() {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(0);
  d.setSeconds(0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FollowUpForm({
  currentUser,
  salesReps,
  leads,
  clients,
  defaultValues,
}: FollowUpFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSalesExecutive = currentUser.role === 'SALES_EXECUTIVE';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FollowUpInput>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      type: defaultValues?.type || 'TASK',
      dueDate: defaultValues?.dueDate || getDefaultDateTimeString(),
      relatedType: defaultValues?.relatedType || (defaultValues?.leadId ? 'LEAD' : defaultValues?.clientId ? 'CLIENT' : 'NONE'),
      leadId: defaultValues?.leadId || '',
      clientId: defaultValues?.clientId || '',
      assignedToId: isSalesExecutive
        ? currentUser.id
        : defaultValues?.assignedToId || salesReps[0]?.id || currentUser.id,
      isRecurring: defaultValues?.isRecurring || false,
      recurrencePattern: defaultValues?.recurrencePattern || 'WEEKLY',
    },
  });

  const selectedType = watch('type');
  const relatedType = watch('relatedType');
  const isRecurring = watch('isRecurring');

  const onSubmit = async (data: FollowUpInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const result = await createFollowUpAction(data);

      if (result.error) {
        setServerError(result.error);
        setIsSubmitting(false);
      } else if (result.success) {
        router.push('/dashboard/follow-ups?success=created');
        router.refresh();
      }
    } catch {
      setServerError('A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectClassName =
    'flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-gray-900';

  const typeOptions: { type: FollowUpType; label: string; icon: React.ElementType }[] = [
    { type: 'TASK', label: 'Task', icon: CheckSquare },
    { type: 'CALL', label: 'Call', icon: PhoneCall },
    { type: 'EMAIL', label: 'Email', icon: Mail },
    { type: 'MEETING', label: 'Meeting', icon: CalendarDays },
    { type: 'OTHER', label: 'Other', icon: Clock },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl pb-12">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/follow-ups" className="hover:text-blue-600 transition-colors">
              Follow-ups
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-800">New Follow-up</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Schedule Follow-up
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create scheduled touchpoints, calls, meetings, or recurring reminders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/follow-ups"
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

      {/* Section 1: Basic Information */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <Clock className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              1. Follow-up Details
            </CardTitle>
          </div>
          <CardDescription>Specify the subject, interaction type, and due time</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Follow-up Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Call to discuss pricing proposal & timeline"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-red-500 font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Type Selector Pills */}
          <div className="space-y-2">
            <Label>Interaction Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setValue('type', opt.type)}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">
                Due Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="dueDate"
                  type="datetime-local"
                  {...register('dueDate')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.dueDate && (
                <p className="text-xs text-red-500 font-medium">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Description / Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Agenda / Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add talking points, prep instructions, or context for this touchpoint..."
              rows={3}
              {...register('description')}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Related Entity (Mutual Exclusivity) */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <Building2 className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              2. Link to Record (Optional)
            </CardTitle>
          </div>
          <CardDescription>
            Associate this follow-up with either an active Client, a prospective Lead, or keep as an unlinked task
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {/* Radio Segment Toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1 max-w-md">
            <button
              type="button"
              onClick={() => {
                setValue('relatedType', 'NONE');
                setValue('leadId', '');
                setValue('clientId', '');
              }}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                relatedType === 'NONE'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              General Task
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('relatedType', 'CLIENT');
                setValue('leadId', '');
              }}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                relatedType === 'CLIENT'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              Link to Client
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('relatedType', 'LEAD');
                setValue('clientId', '');
              }}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
                relatedType === 'LEAD'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              Link to Lead
            </button>
          </div>

          {/* Client Dropdown */}
          {relatedType === 'CLIENT' && (
            <div className="space-y-1.5 max-w-md animate-in fade-in duration-150">
              <Label htmlFor="clientId">
                Select Client <span className="text-red-500">*</span>
              </Label>
              <select
                id="clientId"
                className={selectClassName}
                {...register('clientId')}
                disabled={isSubmitting}
              >
                <option value="">-- Choose an active Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.subtitle ? `(${c.subtitle})` : ''}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-xs text-red-500 font-medium">{errors.clientId.message}</p>
              )}
            </div>
          )}

          {/* Lead Dropdown */}
          {relatedType === 'LEAD' && (
            <div className="space-y-1.5 max-w-md animate-in fade-in duration-150">
              <Label htmlFor="leadId">
                Select Lead <span className="text-red-500">*</span>
              </Label>
              <select
                id="leadId"
                className={selectClassName}
                {...register('leadId')}
                disabled={isSubmitting}
              >
                <option value="">-- Choose a prospective Lead --</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} {l.subtitle ? `(${l.subtitle})` : ''}
                  </option>
                ))}
              </select>
              {errors.leadId && (
                <p className="text-xs text-red-500 font-medium">{errors.leadId.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Recurrence */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <Repeat className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              3. Recurrence & Automation
            </CardTitle>
          </div>
          <CardDescription>
            Automatically re-schedule the next follow-up upon completion
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">Enable Recurring Follow-up</p>
              <p className="text-xs text-gray-500 mt-0.5">
                When marked complete, the next occurrence will be automatically generated with the selected cadence.
              </p>
            </div>
            <input
              type="checkbox"
              id="isRecurring"
              {...register('isRecurring')}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {isRecurring && (
            <div className="space-y-2 max-w-xs animate-in fade-in duration-150 pt-2">
              <Label htmlFor="recurrencePattern">
                Repeat Interval <span className="text-red-500">*</span>
              </Label>
              <select
                id="recurrencePattern"
                className={selectClassName}
                {...register('recurrencePattern')}
                disabled={isSubmitting}
              >
                <option value="DAILY">Daily (+1 Day)</option>
                <option value="WEEKLY">Weekly (+7 Days)</option>
                <option value="MONTHLY">Monthly (+1 Month)</option>
              </select>
              {errors.recurrencePattern && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.recurrencePattern.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Assignment */}
      <Card>
        <CardHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5 text-blue-600">
            <UserCheck className="h-5 w-5" />
            <CardTitle className="text-base font-semibold text-gray-900">
              4. Assignment
            </CardTitle>
          </div>
          <CardDescription>Assign ownership to a sales representative or manager</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isSalesExecutive ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Assigned Owner
                </p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  Assigned to you: {currentUser.name || 'Sales Executive'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  As a Sales Executive, follow-ups you schedule are assigned to your calendar.
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Self-Assigned
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-w-md">
              <Label htmlFor="assignedToId">
                Select Team Member <span className="text-red-500">*</span>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/follow-ups"
          className={buttonVariants({ variant: 'outline' })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Follow-up
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
