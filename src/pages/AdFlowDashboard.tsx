import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, 
  Zap, 
  BarChart3, 
  CreditCard,
  Facebook,
  Instagram
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/adflow/DashboardHeader';
import { KPICard } from '@/components/adflow/KPICard';
import { PlatformStatusCard } from '@/components/adflow/PlatformStatusCard';
import { AIInsightBox } from '@/components/adflow/AIInsightBox';
import { PerformanceChart } from '@/components/adflow/PerformanceChart';
import { LeadRow } from '@/components/adflow/LeadRow';
import { QuickActionTile } from '@/components/adflow/QuickActionTile';
import { 
  useAdFlowStats, 
  useCampaignsByPlatform, 
  useLeads, 
  useChartData,
  useAIInsights,
  useUpdateLead,
  useApplyInsight,
} from '@/hooks/useAdFlowData';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-5 h-5 text-blue-600" />,
  instagram: <Instagram className="w-5 h-5 text-pink-600" />,
  tiktok: <TikTokIcon className="w-5 h-5" />,
  google: <GoogleAdsIcon className="w-5 h-5 text-red-500" />,
};

const platformLabels: Record<string, string> = {
  facebook: 'Facebook Ads',
  instagram: 'Instagram Ads',
  tiktok: 'TikTok Ads',
  google: 'Google Ads',
};

export default function AdFlowDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('7days');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Data hooks
  const { data: stats, isLoading: statsLoading } = useAdFlowStats(dateRange);
  const { data: platformData, isLoading: platformLoading } = useCampaignsByPlatform();
  const { data: leads, isLoading: leadsLoading } = useLeads(5);
  const { data: chartData, isLoading: chartLoading } = useChartData(dateRange);
  const { data: insights } = useAIInsights();

  // Mutations
  const updateLead = useUpdateLead();
  const applyInsight = useApplyInsight();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleAction = (action: string) => {
    toast.success(`${action} initiated successfully!`);
  };

  const handleLeadStatusChange = async (leadId: string, newStatus: 'contacted' | 'closed') => {
    try {
      await updateLead.mutateAsync({ id: leadId, status: newStatus });
      toast.success(`Lead marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update lead status');
    }
  };

  const handleApplyInsight = async (insightId: string) => {
    try {
      await applyInsight.mutateAsync(insightId);
      toast.success('Optimization applied successfully!');
    } catch {
      toast.error('Failed to apply optimization');
    }
  };

  const handleOptimizeCampaign = (platform: string) => {
    toast.success(`Optimizing ${platform} campaigns...`);
  };

  const handlePauseCampaign = (platform: string) => {
    toast.info(`${platform} campaigns paused`);
  };

  const handleScaleCampaign = (platform: string) => {
    toast.success(`Scaling ${platform} campaigns...`);
  };

  // Format leads for display
  const formattedLeads = leads?.map(lead => ({
    id: lead.id,
    name: lead.name,
    source: platformLabels[lead.source] || lead.source,
    sourceIcon: platformIcons[lead.source],
    status: lead.status as 'new' | 'contacted' | 'closed',
    timestamp: formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }),
  })) || [];

  // Format insights for display
  const formattedInsights = insights?.map(insight => ({
    id: insight.id,
    message: insight.message,
    priority: insight.priority as 'high' | 'medium' | 'low',
    actionLabel: insight.action_label || 'Apply Optimization',
  })) || [];

  // Check if any data is still loading
  const _isLoading = statsLoading || platformLoading || leadsLoading || chartLoading;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        businessName={user.email?.split('@')[0] || 'My Business'}
        plan="growth"
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        notificationCount={insights?.length || 0}
        onCreateCampaign={() => handleAction('Campaign creation')}
      />

      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Section 1: KPI Cards */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Leads Generated"
              value={stats?.totalLeads || 0}
              change={stats?.leadsChange}
              status={stats?.leadsChange && stats.leadsChange > 0 ? 'positive' : 'neutral'}
            />
            <KPICard
              title="Cost Per Lead"
              value={stats?.costPerLead || 0}
              prefix="$"
              change={stats?.cplChange}
              status={stats?.cplChange && stats.cplChange > 0 ? 'positive' : stats?.cplChange && stats.cplChange < 0 ? 'negative' : 'neutral'}
            />
            <KPICard
              title="Estimated Revenue"
              value={stats?.estimatedRevenue?.toLocaleString() || '0'}
              prefix="$"
              change={stats?.revenueChange}
              status="positive"
            />
            <KPICard
              title="ROI"
              value={stats?.roi || 0}
              suffix="%"
              change={stats?.roiChange}
              status={stats?.isRoiPositive ? 'positive' : 'negative'}
              statusBadge={stats?.isRoiPositive ? '🔥 Profitable' : '⚠️ Needs Attention'}
            />
          </div>
        </section>

        {/* Section 2: Campaign Health */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Campaign Health</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformData?.map((platform) => (
              <PlatformStatusCard
                key={platform.platform}
                platform={platformLabels[platform.platform]}
                icon={platformIcons[platform.platform]}
                status={platform.status}
                leads={platform.leads}
                costPerLead={platform.costPerLead}
                onOptimize={() => handleOptimizeCampaign(platform.platform)}
                onPause={() => handlePauseCampaign(platform.platform)}
                onScale={() => handleScaleCampaign(platform.platform)}
              />
            ))}
            {(!platformData || platformData.length === 0) && !platformLoading && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No active campaigns. Create your first campaign to get started!
              </div>
            )}
          </div>
        </section>

        {/* Section 3 & 4: Chart and AI Insights */}
        <div className="grid lg:grid-cols-2 gap-6">
          <PerformanceChart data={chartData || []} />
          <AIInsightBox
            insights={formattedInsights}
            onApply={handleApplyInsight}
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
            {formattedLeads.length > 0 ? (
              formattedLeads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  name={lead.name}
                  source={lead.source}
                  sourceIcon={lead.sourceIcon}
                  status={lead.status}
                  timestamp={lead.timestamp}
                  onCall={() => handleAction(`Calling ${lead.name}`)}
                  onMessage={() => handleAction(`Messaging ${lead.name}`)}
                  onMarkClosed={() => handleLeadStatusChange(lead.id, 'closed')}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border/50">
                No leads yet. Start a campaign to generate leads!
              </div>
            )}
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
