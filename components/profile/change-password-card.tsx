'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/schemas';
import { changePasswordAction } from '@/app/actions/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

export function ChangePasswordCard() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await changePasswordAction(data);
      if (!res.success) {
        setServerError(res.error || 'Failed to update password');
      } else {
        setSuccessMessage(res.message || 'Password changed successfully.');
        reset();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
    });
  };

  return (
    <Card className="shadow-xs border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">Change Password</CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Update your account password to maintain security.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {successMessage && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {serverError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="text-xs font-semibold text-gray-700">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Enter current password"
                className="pr-10"
                disabled={isPending}
                {...register('currentPassword')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.currentPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-700">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                className="pr-10"
                disabled={isPending}
                {...register('newPassword')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword ? (
              <p className="text-xs text-red-600 mt-1">{errors.newPassword.message}</p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-0.5">
                Must be at least 8 characters with at least 1 letter and 1 number.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword" className="text-xs font-semibold text-gray-700">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                className="pr-10"
                disabled={isPending}
                {...register('confirmNewPassword')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="text-xs text-red-600 mt-1">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
