'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import type { DateRangeFilter, DateRangeType } from '@/types/reports';

interface DateRangeSelectorProps {
  currentFilter: DateRangeFilter;
  onFilterChange: (filter: DateRangeFilter) => void;
  isLoading?: boolean;
}

export function DateRangeSelector({
  currentFilter,
  onFilterChange,
  isLoading = false,
}: DateRangeSelectorProps) {
  const [selectedType, setSelectedType] = useState<DateRangeType>(currentFilter.type);
  const [customFrom, setCustomFrom] = useState(currentFilter.from || '');
  const [customTo, setCustomTo] = useState(currentFilter.to || '');
  const [showCustomInputs, setShowCustomInputs] = useState(currentFilter.type === 'CUSTOM');

  const options: { type: DateRangeType; label: string }[] = [
    { type: 'THIS_MONTH', label: 'This Month' },
    { type: 'LAST_MONTH', label: 'Last Month' },
    { type: 'THIS_QUARTER', label: 'This Quarter' },
    { type: 'THIS_YEAR', label: 'This Year' },
    { type: 'CUSTOM', label: 'Custom' },
  ];

  const handleSelect = (type: DateRangeType) => {
    setSelectedType(type);
    if (type === 'CUSTOM') {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
      onFilterChange({ type });
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFrom && customTo) {
      onFilterChange({
        type: 'CUSTOM',
        from: customFrom,
        to: customTo,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Pills */}
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
        {options.map((opt) => {
          const isActive = selectedType === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelect(opt.type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              } disabled:opacity-50`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Custom Range Picker */}
      {showCustomInputs && (
        <form
          onSubmit={handleApplyCustom}
          className="flex flex-wrap items-center gap-2 animate-in fade-in"
        >
          <div className="flex items-center gap-1.5 rounded-xl border border-input bg-card px-2.5 py-1 text-xs shadow-sm">
            <span className="text-muted-foreground">From:</span>
            <input
              type="date"
              required
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-input bg-card px-2.5 py-1 text-xs shadow-sm">
            <span className="text-muted-foreground">To:</span>
            <input
              type="date"
              required
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !customFrom || !customTo}
            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Check className="h-3 w-3" />
            <span>Apply</span>
          </button>
        </form>
      )}
    </div>
  );
}
