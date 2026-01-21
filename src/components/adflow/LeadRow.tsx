import { Phone, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type LeadStatus = 'new' | 'contacted' | 'closed';

interface LeadRowProps {
  name: string;
  source: string;
  sourceIcon?: React.ReactNode;
  status: LeadStatus;
  timestamp?: string;
  onCall?: () => void;
  onMessage?: () => void;
  onMarkClosed?: () => void;
}

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  'new': { 
    label: 'New', 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  },
  'contacted': { 
    label: 'Contacted', 
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  },
  'closed': { 
    label: 'Closed', 
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  },
};

export function LeadRow({
  name,
  source,
  sourceIcon,
  status,
  timestamp,
  onCall,
  onMessage,
  onMarkClosed,
}: LeadRowProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">{name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {sourceIcon && <span className="shrink-0">{sourceIcon}</span>}
            <span className="truncate">{source}</span>
            {timestamp && (
              <>
                <span className="shrink-0">•</span>
                <span className="shrink-0">{timestamp}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium shrink-0", config.className)}>
          {config.label}
        </span>
        
        <div className="hidden sm:flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCall}>
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMessage}>
            <Mail className="w-4 h-4" />
          </Button>
          {status !== 'closed' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={onMarkClosed}>
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
