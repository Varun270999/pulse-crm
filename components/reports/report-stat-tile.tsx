import { ReactNode } from 'react';

interface ReportStatTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function ReportStatTile({
  title,
  value,
  subtitle,
  icon,
  trend,
}: ReportStatTileProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {(subtitle || trend) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
