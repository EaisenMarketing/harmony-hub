import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Zap, Pause, TrendingUp } from 'lucide-react';

type HealthStatus = 'healthy' | 'needs-optimization' | 'underperforming';

interface PlatformStatusCardProps {
  platform: string;
  icon: React.ReactNode;
  status: HealthStatus;
  leads: number;
  costPerLead: number;
  onOptimize?: () => void;
  onPause?: () => void;
  onScale?: () => void;
}

const statusConfig: Record<HealthStatus, { label: string; color: string; dot: string }> = {
  'healthy': { 
    label: 'Healthy', 
    color: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  },
  'needs-optimization': { 
    label: 'Needs Optimization', 
    color: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  'underperforming': { 
    label: 'Underperforming', 
    color: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500'
  },
};

export function PlatformStatusCard({
  platform,
  icon,
  status,
  leads,
  costPerLead,
  onOptimize,
  onPause,
  onScale,
}: PlatformStatusCardProps) {
  const config = statusConfig[status];

  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{platform}</h3>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full animate-pulse", config.dot)} />
              <span className={cn("text-sm font-medium", config.color)}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Leads</p>
          <p className="text-xl font-bold text-foreground">{leads}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Cost/Lead</p>
          <p className="text-xl font-bold text-foreground">${costPerLead.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={onOptimize}
        >
          <Zap className="w-3.5 h-3.5 mr-1" />
          Optimize
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={onPause}
        >
          <Pause className="w-3.5 h-3.5 mr-1" />
          Pause
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={onScale}
        >
          <TrendingUp className="w-3.5 h-3.5 mr-1" />
          Scale
        </Button>
      </div>
    </div>
  );
}
