import { Plus, Bell, Settings, ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  businessName: string;
  plan: 'starter' | 'growth' | 'pro';
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  notificationCount?: number;
  onCreateCampaign?: () => void;
}

const planConfig = {
  starter: { label: 'Starter', className: 'bg-muted text-muted-foreground' },
  growth: { label: 'Growth', className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  pro: { label: 'Pro', className: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' },
};

export function DashboardHeader({
  businessName,
  plan,
  dateRange,
  onDateRangeChange,
  notificationCount = 0,
  onCreateCampaign,
}: DashboardHeaderProps) {
  const planInfo = planConfig[plan];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Logo & Business */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{businessName}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", planInfo.className)}>
                  {planInfo.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">AdFlow AI</p>
            </div>
          </div>

          {/* Center: Date Range */}
          <div className="hidden md:block">
            <Select value={dateRange} onValueChange={onDateRangeChange}>
              <SelectTrigger className="w-40 bg-muted/50 border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={onCreateCampaign}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Create Campaign</span>
              <span className="sm:hidden">New</span>
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-sm">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-destructive">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
