'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  dealCaptureSchema,
  type DealCaptureInput,
  type DealUpdateInput,
} from '@/lib/schemas/deal';
import { createDealAction, updateDealDetailsAction } from '@/app/actions/deals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Building2,
  IndianRupee,
  UserCog,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  STAGE_CONFIG,
  STAGE_DEFAULT_PROBABILITY,
  STAGES_ORDER,
  type DealData,
  type PipelineStageType,
} from '@/types/deal';

interface ClientOption {
  id: string;
  companyName: string;
}

interface SalesRepOption {
  id: string;
  name: string;
  role: string;
}

interface DealFormProps {
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  clients: ClientOption[];
  salesReps: SalesRepOption[];
  initialClientId?: string;
  dealToEdit?: DealData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DealForm({
  currentUser,
  clients,
  salesReps,
  initialClientId,
  dealToEdit,
  onSuccess,
  onCancel,
}: DealFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSalesExecutive = currentUser.role === 'SALES_EXECUTIVE';
  const isEditing = !!dealToEdit;

  const defaultStage: PipelineStageType = dealToEdit?.stage || 'NEW';
  const defaultProbability = dealToEdit
    ? dealToEdit.probability
    : STAGE_DEFAULT_PROBABILITY[defaultStage];

  const defaultCloseDate = dealToEdit?.expectedCloseDate
    ? new Date(dealToEdit.expectedCloseDate).toISOString().split('T')[0]
    : '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealCaptureInput>({
    resolver: zodResolver(dealCaptureSchema),
    defaultValues: {
      title: dealToEdit?.title || '',
      clientId: dealToEdit?.clientId || initialClientId || (clients[0]?.id ?? ''),
      value: dealToEdit ? dealToEdit.value.toString() : '',
      stage: defaultStage,
      probability: defaultProbability,
      expectedCloseDate: defaultCloseDate,
      notes: dealToEdit?.notes || '',
      assignedToId: dealToEdit?.assignedToId || (isSalesExecutive ? currentUser.id : (salesReps[0]?.id ?? currentUser.id)),
    },
  });

  const selectedStage = watch('stage') as PipelineStageType;
  const currentProbability = watch('probability');

  function handleStageChange(newStage: PipelineStageType) {
    setValue('stage', newStage);
    // Auto-update probability to stage default
    setValue('probability', STAGE_DEFAULT_PROBABILITY[newStage]);
  }

  async function onSubmit(data: DealCaptureInput) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      if (isEditing && dealToEdit) {
        const updatePayload: DealUpdateInput = {
          id: dealToEdit.id,
          title: data.title,
          clientId: data.clientId,
          value: data.value,
          stage: (data.stage || 'NEW') as PipelineStageType,
          probability: Number(data.probability),
          expectedCloseDate: data.expectedCloseDate || undefined,
          notes: data.notes || undefined,
          assignedToId: data.assignedToId,
        };

        const res = await updateDealDetailsAction(updatePayload);
        if (res.error) {
          setServerError(res.error);
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createDealAction(data);
        if (res.error) {
          setServerError(res.error);
          setIsSubmitting(false);
          return;
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/pipeline');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setServerError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-sm border-border/80">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Link
                href="/dashboard/pipeline"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-8 w-8 p-0 text-muted-foreground hover:text-foreground'
                )}
                title="Back to Pipeline"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <div>
              <CardTitle className="text-xl font-bold">
                {isEditing ? 'Edit Deal' : 'Create New Deal'}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? 'Update deal information, stage, and probability'
                  : 'Add a prospective deal to the sales pipeline'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Deal Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Deal Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Annual Cloud Migration & Maintenance Contract"
              {...register('title')}
              className={errors.title ? 'border-rose-500' : ''}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-rose-500">{errors.title.message}</p>
            )}
          </div>

          {/* Client Selector */}
          <div className="space-y-2">
            <Label htmlFor="clientId">
              Client Company <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <select
                id="clientId"
                {...register('clientId')}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  errors.clientId ? 'border-rose-500' : ''
                )}
                disabled={isSubmitting || (!!initialClientId && !dealToEdit)}
              >
                <option value="" disabled>Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
            {errors.clientId && (
              <p className="text-xs text-rose-500">{errors.clientId.message}</p>
            )}
          </div>

          {/* Deal Value & Stage Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deal Value */}
            <div className="space-y-2">
              <Label htmlFor="value">
                Deal Value (INR ₹) <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="value"
                  type="number"
                  step="any"
                  placeholder="e.g. 250000"
                  className={cn('pl-9', errors.value ? 'border-rose-500' : '')}
                  {...register('value')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.value && (
                <p className="text-xs text-rose-500">{errors.value.message}</p>
              )}
            </div>

            {/* Pipeline Stage */}
            <div className="space-y-2">
              <Label htmlFor="stage">
                Pipeline Stage <span className="text-rose-500">*</span>
              </Label>
              <select
                id="stage"
                value={selectedStage}
                onChange={(e) => handleStageChange(e.target.value as PipelineStageType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                {STAGES_ORDER.map((stg) => (
                  <option key={stg} value={stg}>
                    {STAGE_CONFIG[stg].label} (Default {STAGE_CONFIG[stg].defaultProbability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Probability & Expected Close Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Win Probability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="probability">
                  Win Probability (%) <span className="text-rose-500">*</span>
                </Label>
                <span className="text-xs font-semibold text-primary">
                  {currentProbability ?? 0}%
                </span>
              </div>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  className={cn('pl-9', errors.probability ? 'border-rose-500' : '')}
                  {...register('probability')}
                  disabled={isSubmitting}
                />
              </div>
              {errors.probability && (
                <p className="text-xs text-rose-500">{errors.probability.message}</p>
              )}
            </div>

            {/* Expected Close Date */}
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expectedCloseDate"
                  type="date"
                  className="pl-9"
                  {...register('expectedCloseDate')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Assigned Sales Representative */}
          <div className="space-y-2">
            <Label htmlFor="assignedToId">
              Assigned Representative <span className="text-rose-500">*</span>
            </Label>
            {isSalesExecutive ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                <UserCog className="h-4 w-4 text-primary" />
                <span>{currentUser.name || 'You'} (Assigned to you)</span>
                <input
                  type="hidden"
                  value={currentUser.id}
                  {...register('assignedToId')}
                />
              </div>
            ) : (
              <div className="relative">
                <UserCog className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <select
                  id="assignedToId"
                  {...register('assignedToId')}
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    errors.assignedToId ? 'border-rose-500' : ''
                  )}
                  disabled={isSubmitting}
                >
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name} ({rep.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {errors.assignedToId && (
              <p className="text-xs text-rose-500">{errors.assignedToId.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Deal Notes / Scope Details</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Key requirements, client decision makers, timeline constraints..."
              {...register('notes')}
              disabled={isSubmitting}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            ) : (
              <Link
                href="/dashboard/pipeline"
                className={cn(buttonVariants({ variant: 'outline' }))}
              >
                Cancel
              </Link>
            )}

            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Deal'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
