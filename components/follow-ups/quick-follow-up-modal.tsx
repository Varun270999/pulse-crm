'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  quickFollowUpSchema,
  type QuickFollowUpInput,
} from '@/lib/schemas/follow-up';
import type { FollowUpType } from '@/types/follow-up';
import { createQuickFollowUpAction } from '@/app/actions/follow-ups';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Loader2,
  AlertCircle,
  Building2,
  User,
  PhoneCall,
  Mail,
  CalendarDays,
  CheckSquare,
  Clock,
  Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickFollowUpModalProps {
  open: boolean;
  onClose: () => void;
  target: {
    type: 'CLIENT' | 'LEAD';
    id: string;
    name: string;
  } | null;
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

function getDefaultDateTimeString() {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  d.setMinutes(0);
  d.setSeconds(0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function QuickFollowUpModal({
  open,
  onClose,
  target,
  currentUser,
}: QuickFollowUpModalProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuickFollowUpInput>({
    resolver: zodResolver(quickFollowUpSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'CALL',
      dueDate: getDefaultDateTimeString(),
      leadId: target?.type === 'LEAD' ? target.id : undefined,
      clientId: target?.type === 'CLIENT' ? target.id : undefined,
      assignedToId: currentUser.id,
      isRecurring: false,
      recurrencePattern: 'WEEKLY',
    },
  });

  const selectedType = watch('type');
  const isRecurring = watch('isRecurring');

  const handleClose = () => {
    if (isSubmitting) return;
    setServerError(null);
    reset();
    onClose();
  };

  const onSubmit = async (data: QuickFollowUpInput) => {
    setIsSubmitting(true);
    setServerError(null);

    const payload = {
      ...data,
      leadId: target?.type === 'LEAD' ? target.id : undefined,
      clientId: target?.type === 'CLIENT' ? target.id : undefined,
      assignedToId: currentUser.id,
    };

    try {
      const result = await createQuickFollowUpAction(payload);

      if (result.error) {
        setServerError(result.error);
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        reset();
        onClose();
        router.refresh();
      }
    } catch {
      setServerError('A network error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const typeOptions: { type: FollowUpType; label: string; icon: React.ElementType }[] = [
    { type: 'CALL', label: 'Call', icon: PhoneCall },
    { type: 'EMAIL', label: 'Email', icon: Mail },
    { type: 'MEETING', label: 'Meeting', icon: CalendarDays },
    { type: 'TASK', label: 'Task', icon: CheckSquare },
    { type: 'OTHER', label: 'Other', icon: Clock },
  ];

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Calendar className="h-5 w-5" />
            <DialogTitle>Schedule Follow-up</DialogTitle>
          </div>
          <DialogDescription>
            Create a scheduled reminder for{' '}
            <span className="font-semibold text-gray-900">{target.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target Info Pill */}
          <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 p-3 border border-blue-100 text-xs text-blue-950">
            {target.type === 'CLIENT' ? (
              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
            ) : (
              <User className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">
              Linked to {target.type === 'CLIENT' ? 'Client' : 'Lead'}:{' '}
              <strong className="font-bold text-blue-900">{target.name}</strong>
            </span>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="quickTitle">
              Follow-up Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quickTitle"
              placeholder="e.g. Follow-up call on commercial terms"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Type Selector Pills */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setValue('type', opt.type)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-[11px] font-semibold transition-all',
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="space-y-1">
            <Label htmlFor="quickDueDate">
              Due Date & Time <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quickDueDate"
              type="datetime-local"
              {...register('dueDate')}
              disabled={isSubmitting}
            />
            {errors.dueDate && (
              <p className="text-xs text-red-500">{errors.dueDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="quickDescription">Notes / Talking Points</Label>
            <Textarea
              id="quickDescription"
              placeholder="Key notes, context, or action items..."
              rows={2}
              {...register('description')}
              disabled={isSubmitting}
            />
          </div>

          {/* Recurrence */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-semibold text-gray-900">Repeat Follow-up</span>
              </div>
              <input
                type="checkbox"
                id="quickIsRecurring"
                {...register('isRecurring')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-gray-200/60 flex items-center gap-2">
                <span className="text-xs text-gray-600">Interval:</span>
                <select
                  {...register('recurrencePattern')}
                  className="h-7 text-xs rounded-md border border-gray-300 bg-white px-2 text-gray-800"
                >
                  <option value="DAILY">Daily (+1 Day)</option>
                  <option value="WEEKLY">Weekly (+7 Days)</option>
                  <option value="MONTHLY">Monthly (+1 Month)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[130px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Save Follow-up'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
