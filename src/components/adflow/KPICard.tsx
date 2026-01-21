import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  prefix?: string;
  suffix?: string;
  status?: 'positive' | 'negative' | 'neutral';
  statusBadge?: string;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  prefix = '',
  suffix = '',
  status = 'neutral',
  statusBadge,
}: KPICardProps) {
  const isPositive = change !== undefined ? change > 0 : status === 'positive';
  const isNegative = change !== undefined ? change < 0 : status === 'negative';

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      <p className="text-muted-foreground text-sm font-medium mb-2">{title}</p>
      
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </span>
        {statusBadge && (
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-semibold",
            status === 'positive' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            status === 'negative' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            status === 'neutral' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          )}>
            {statusBadge}
          </span>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium",
            isPositive && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            isNegative && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            !isPositive && !isNegative && "bg-muted text-muted-foreground"
          )}>
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : isNegative ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
