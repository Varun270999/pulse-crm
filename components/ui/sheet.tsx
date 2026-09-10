'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  side?: 'right' | 'left';
}

export function Sheet({
  open,
  onOpenChange,
  children,
  className,
  side = 'right',
}: SheetProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 flex max-w-full',
          side === 'right' ? 'right-0 pl-10' : 'left-0 pr-10'
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'w-screen max-w-xl bg-white shadow-2xl flex flex-col focus:outline-none transition ease-in-out duration-300',
            side === 'right'
              ? 'animate-in slide-in-from-right duration-300'
              : 'animate-in slide-in-from-left duration-300',
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  children,
  onClose,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  return (
    <div
      className={cn(
        'px-6 py-5 border-b border-gray-100 flex items-center justify-between',
        className
      )}
      {...props}
    >
      <div className="flex flex-col space-y-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-bold text-gray-900', className)} {...props} />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-gray-500', className)} {...props} />;
}

export function SheetBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto px-6 py-6 space-y-6', className)}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-100 bg-gray-50/70',
        className
      )}
      {...props}
    />
  );
}
