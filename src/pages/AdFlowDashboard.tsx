import { useState } from 'react';
import { 
  Rocket, 
  Zap, 
  BarChart3, 
  CreditCard,
  Facebook,
  Instagram
} from 'lucide-react';
import { DashboardHeader } from '@/components/adflow/DashboardHeader';
import { KPICard } from '@/components/adflow/KPICard';
import { PlatformStatusCard } from '@/components/adflow/PlatformStatusCard';
import { AIInsightBox } from '@/components/adflow/AIInsightBox';
import { PerformanceChart } from '@/components/adflow/PerformanceChart';
import { LeadRow } from '@/components/adflow/LeadRow';
import { QuickActionTile } from '@/components/adflow/QuickActionTile';
import { toast } from 'sonner';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Google Ads icon component
const GoogleAdsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
  </svg>
);

// Mock data
const mockChartData = [
  { date: 'Mon', leads: 12, adSpend: 45 },
  { date: 'Tue', leads: 19, adSpend: 52 },
  { date: 'Wed', leads: 15, adSpend: 48 },
  { date: 'Thu', leads: 25, adSpend: 61 },
  { date: 'Fri', leads: 32, adSpend: 75 },
  { date: 'Sat', leads: 28, adSpend: 68 },
  { date: 'Sun', leads: 35, adSpend: 72 },
];

const mockInsights = [
  {
    id: '1',
    message: 'TikTok is generating leads 23% cheaper than Facebook. Consider reallocating $15/day to maximize ROI.',
    priority: 'high' as const,
    actionLabel: 'Reallocate Budget',
  },
  {
    id: '2',
    message: 'Your Google Ads campaign "Summer Sale" is converting well. We recommend scaling the budget by 20%.',
    priority: 'medium' as const,
    actionLabel: 'Scale Campaign',
  },
];

const mockLeads = [
  { id: '1', name: 'Sarah Johnson', source: 'Facebook', status: 'new' as const, timestamp: '2 min ago' },
  { id: '2', name: 'Michael Chen', source: 'Google', status: 'contacted' as const, timestamp: '15 min ago' },
  { id: '3', name: 'Emily Rodriguez', source: 'TikTok', status: 'new' as const, timestamp: '1 hour ago' },
  { id: '4', name: 'David Kim', source: 'Instagram', status: 'closed' as const, timestamp: '2 hours ago' },
  { id: '5', name: 'Jessica Brown', source: 'Facebook', status: 'contacted' as const, timestamp: '3 hours ago' },
];

export default function AdFlowDashboard() {
  const [dateRange, setDateRange] = useState('7days');

  const handleAction = (action: string) => {
    toast.success(`${action} initiated successfully!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        businessName="My Business"
        plan="growth"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        notificationCount={3}
        onCreateCampaign={() => handleAction('Campaign creation')}
      />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Section 1: KPI Cards */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Leads Generated"
              value={167}
              change={12.5}
              status="positive"
            />
            <KPICard
              title="Cost Per Lead"
              value={4.23}
              prefix="$"
              change={-8.3}
              status="positive"
            />
            <KPICard
              title="Estimated Revenue"
              value="12,450"
              prefix="$"
              change={18.2}
              status="positive"
            />
            <KPICard
              title="ROI"
              value={285}
              suffix="%"
              change={22}
              status="positive"
              statusBadge="🔥 Profitable"
            />
          </div>
        </section>

        {/* Section 2: Campaign Health */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Campaign Health</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlatformStatusCard
              platform="Facebook Ads"
              icon={<Facebook className="w-5 h-5 text-blue-600" />}
              status="healthy"
              leads={45}
              costPerLead={4.50}
              onOptimize={() => handleAction('Facebook optimization')}
              onPause={() => handleAction('Facebook pause')}
              onScale={() => handleAction('Facebook scale')}
            />
            <PlatformStatusCard
              platform="Instagram Ads"
              icon={<Instagram className="w-5 h-5 text-pink-600" />}
              status="needs-optimization"
              leads={32}
              costPerLead={5.20}
              onOptimize={() => handleAction('Instagram optimization')}
              onPause={() => handleAction('Instagram pause')}
              onScale={() => handleAction('Instagram scale')}
            />
            <PlatformStatusCard
              platform="TikTok Ads"
              icon={<TikTokIcon className="w-5 h-5" />}
              status="healthy"
              leads={58}
              costPerLead={3.45}
              onOptimize={() => handleAction('TikTok optimization')}
              onPause={() => handleAction('TikTok pause')}
              onScale={() => handleAction('TikTok scale')}
            />
            <PlatformStatusCard
              platform="Google Ads"
              icon={<GoogleAdsIcon className="w-5 h-5 text-red-500" />}
              status="underperforming"
              leads={22}
              costPerLead={6.80}
              onOptimize={() => handleAction('Google optimization')}
              onPause={() => handleAction('Google pause')}
              onScale={() => handleAction('Google scale')}
            />
          </div>
        </section>

        {/* Section 3 & 4: Chart and AI Insights */}
        <div className="grid lg:grid-cols-2 gap-6">
          <PerformanceChart data={mockChartData} />
          <AIInsightBox
            insights={mockInsights}
            onApply={(id) => handleAction(`Insight ${id} applied`)}
            onViewDetails={(id) => handleAction(`Viewing details for insight ${id}`)}
          />
        </div>

        {/* Section 5: Real-Time Leads */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Recent Leads</h2>
            <button className="text-sm text-primary hover:underline font-medium">
              View All Leads
            </button>
          </div>
          <div className="space-y-3">
            {mockLeads.map((lead) => (
              <LeadRow
                key={lead.id}
                name={lead.name}
                source={lead.source}
                status={lead.status}
                timestamp={lead.timestamp}
                onCall={() => handleAction(`Calling ${lead.name}`)}
                onMessage={() => handleAction(`Messaging ${lead.name}`)}
                onMarkClosed={() => handleAction(`Marked ${lead.name} as closed`)}
              />
            ))}
          </div>
        </section>

        {/* Section 6: Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionTile
              icon={<Rocket className="w-6 h-6 text-white" />}
              label="Launch Campaign"
              description="Start a new ad campaign"
              variant="primary"
              onClick={() => handleAction('Launch campaign')}
            />
            <QuickActionTile
              icon={<Zap className="w-6 h-6" />}
              label="Optimize All"
              description="Auto-optimize campaigns"
              onClick={() => handleAction('Optimize all')}
            />
            <QuickActionTile
              icon={<BarChart3 className="w-6 h-6" />}
              label="View Reports"
              description="Detailed analytics"
              onClick={() => handleAction('View reports')}
            />
            <QuickActionTile
              icon={<CreditCard className="w-6 h-6 text-white" />}
              label="Upgrade Plan"
              description="Unlock more features"
              variant="premium"
              onClick={() => handleAction('Upgrade plan')}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
