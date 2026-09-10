'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signOut } from 'next-auth/react';
import { updateEmailSchema, type UpdateEmailInput } from '@/lib/schemas';
import { updateEmailAction } from '@/app/actions/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, LogOut, ShieldAlert } from 'lucide-react';

interface UpdateEmailCardProps {
  currentEmail: string;
}

export function UpdateEmailCard({ currentEmail }: UpdateEmailCardProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UpdateEmailInput>({
    resolver: zodResolver(updateEmailSchema),
    defaultValues: {
      newEmail: '',
      currentPassword: '',
    },
  });

  // Countdown timer for automatic sign-out after email update
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      signOut({ redirectTo: '/login?email_updated=1' });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = (data: UpdateEmailInput) => {
    setServerError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await updateEmailAction(data);
      if (!res.success) {
        if (res.error === 'This email is already in use') {
          setError('newEmail', { type: 'manual', message: 'This email is already in use' });
        } else if (res.error === 'Current password is incorrect') {
          setError('currentPassword', { type: 'manual', message: 'Current password is incorrect' });
        } else {
          setServerError(res.error || 'Failed to update email address');
        }
      } else {
        setSuccessMessage(res.message || 'Your email has been updated. Please use this new email to log in next time.');
        // Start 3-second countdown to sign out cleanly and invalidate old session token
        setCountdown(3);
      }
    });
  };

  const handleImmediateSignOut = () => {
    signOut({ redirectTo: '/login?email_updated=1' });
  };

  return (
    <Card className="shadow-xs border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-gray-900">Update Email</CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Change the primary email address linked to your account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Current Email Display */}
        <div className="mb-4 rounded-xl bg-gray-50 p-3 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              Current Email
            </p>
            <p className="text-sm font-semibold text-gray-800">{currentEmail || '—'}</p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Verified
          </span>
        </div>

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-emerald-900">{successMessage}</p>
                <p className="text-xs text-emerald-700">
                  For your security, you are being redirected to sign in with your updated email{' '}
                  {countdown !== null && (
                    <span className="font-bold">in {countdown}s...</span>
                  )}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleImmediateSignOut}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 shadow-xs"
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Sign In With New Email Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {serverError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span className="font-medium">{serverError}</span>
          </div>
        )}

        {!successMessage && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newEmail" className="text-xs font-semibold text-gray-700">
                New Email Address
              </Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="name@company.com"
                disabled={isPending}
                {...register('newEmail')}
              />
              {errors.newEmail && (
                <p className="text-xs text-red-600 mt-1">{errors.newEmail.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailCurrentPassword" className="text-xs font-semibold text-gray-700">
                  Current Password
                </Label>
                <span className="text-[11px] text-gray-400">Identity verification</span>
              </div>
              <div className="relative">
                <Input
                  id="emailCurrentPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter current password to confirm"
                  className="pr-10"
                  disabled={isPending}
                  {...register('currentPassword')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-600 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50/70 border border-amber-100 p-2.5 text-[11px] text-amber-800">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Updating your email address will change your login credentials. You will need to log back in using your new email address.
              </span>
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
                    <Mail className="mr-2 h-4 w-4" />
                    Update Email
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
