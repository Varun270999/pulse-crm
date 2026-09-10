'use client';

import { useSearchParams } from 'next/navigation';
import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';

export function AccessDeniedAlert() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [dismissed, setDismissed] = useState(false);

  if (error !== 'access_denied' || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 flex items-start justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div>
          <h4 className="text-sm font-semibold">Access Denied</h4>
          <p className="mt-0.5 text-sm text-red-700">
            You do not have permission to access that module with your current role. You have been redirected to the dashboard.
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 text-red-600 hover:bg-red-100 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
