import { cn } from '@/lib/utils';

interface QuickActionTileProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  variant?: 'default' | 'primary' | 'premium';
  onClick?: () => void;
}

export function QuickActionTile({
  icon,
  label,
  description,
  variant = 'default',
  onClick,
}: QuickActionTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
        variant === 'default' && "bg-card border-border/50 hover:border-primary/30 hover:shadow-md",
        variant === 'primary' && "bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white hover:shadow-lg hover:shadow-indigo-500/25",
        variant === 'premium' && "bg-gradient-to-br from-amber-400 to-orange-500 border-transparent text-white hover:shadow-lg hover:shadow-amber-500/25"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
        variant === 'default' && "bg-muted",
        variant === 'primary' && "bg-white/20",
        variant === 'premium' && "bg-white/20"
      )}>
        {icon}
      </div>
      <h3 className={cn(
        "font-semibold text-lg mb-1",
        variant === 'default' && "text-foreground"
      )}>
        {label}
      </h3>
      {description && (
        <p className={cn(
          "text-sm",
          variant === 'default' && "text-muted-foreground",
          (variant === 'primary' || variant === 'premium') && "text-white/80"
        )}>
          {description}
        </p>
      )}
    </button>
  );
}
