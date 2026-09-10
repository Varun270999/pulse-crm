'use client';

import { useState } from 'react';
import { Copy, Check, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TempPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  employeeEmail: string;
  employeeId?: string | null;
  tempPassword: string;
  isPasswordReset?: boolean;
  redirectHref?: string;
}

export function TempPasswordModal({
  isOpen,
  onClose,
  employeeName,
  employeeEmail,
  employeeId,
  tempPassword,
  isPasswordReset = false,
  redirectHref,
}: TempPasswordModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-2xl border border-border">
        {/* Header Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-4">
          <KeyRound className="h-6 w-6" />
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">
            {isPasswordReset ? 'Password Reset Successfully' : 'Employee Account Created'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPasswordReset ? (
              <>A new temporary password was generated for <span className="font-medium text-foreground">{employeeName}</span> ({employeeEmail}).</>
            ) : (
              <>Account provisioned for <span className="font-medium text-foreground">{employeeName}</span> {employeeId ? `(${employeeId})` : ''}.</>
            )}
          </p>
        </div>

        {/* Password Display Box */}
        <div className="mt-5 rounded-xl border border-border bg-muted/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Temporary Password
            </span>
            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <code className="font-mono text-lg font-bold tracking-wide text-foreground selection:bg-primary/20">
              {tempPassword}
            </code>
          </div>
        </div>

        {/* Security Warning Callout */}
        <div className="mt-4 flex gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-medium">One-Time Display Alert</p>
            <p className="mt-0.5">
              Share this temporary password securely with the employee. They should change it after their first login. This password will not be shown again.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          {redirectHref ? (
            <Link
              href={redirectHref}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <span>Continue to Employee Directory</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={onClose}
              type="button"
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              I Have Saved the Password
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
