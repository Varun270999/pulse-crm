import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  category?: string;
  features?: string[];
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  category = 'Module',
  features,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      {/* Header Breadcrumb / Meta */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-800">{title}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Icon className="h-5 w-5" />
            </div>
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'inline-flex items-center gap-2')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Status Card */}
      <Card className="border-dashed border-2 bg-white/70 shadow-sm">
        <CardHeader className="text-center pb-2 pt-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <Icon className="h-8 w-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 self-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 mb-2">
            <Clock className="h-3.5 w-3.5" />
            {category} • Coming Soon
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {title} Module Under Construction
          </CardTitle>
          <CardDescription className="max-w-md mx-auto text-gray-600 mt-1">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-12 text-center">
          {features && features.length > 0 && (
            <div className="max-w-lg mx-auto mb-8 text-left bg-gray-50 p-5 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 font-medium text-xs text-gray-500 uppercase tracking-wider mb-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Planned Capabilities
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: 'default' })}
            >
              Return to Overview
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
