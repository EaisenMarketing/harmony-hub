import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Campaign = Tables<'campaigns'>;
export type Lead = Tables<'leads'>;
export type AdSpend = Tables<'ad_spend'>;
export type AIInsight = Tables<'ai_insights'>;

// ============ DASHBOARD STATS ============
export const useAdFlowStats = (dateRange: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['adflow-stats', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;

      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case '7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30days':
        default:
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
      }

      // Get leads count and calculate metrics
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (leadsError) throw leadsError;

      // Get ad spend for period
      const { data: adSpend, error: spendError } = await supabase
        .from('ad_spend')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0]);

      if (spendError) throw spendError;

      // Get previous period for comparison
      const periodLength = dateRange === 'today' ? 1 : dateRange === '7days' ? 7 : 30;
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - periodLength);

      const { data: prevLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const { data: prevSpend } = await supabase
        .from('ad_spend')
        .select('spend_amount')
        .eq('user_id', user.id)
        .gte('date', prevStartDate.toISOString().split('T')[0])
        .lt('date', startDate.toISOString().split('T')[0]);

      const totalLeads = leads?.length || 0;
      const totalSpend = adSpend?.reduce((sum, s) => sum + Number(s.spend_amount), 0) || 0;
      const avgTicketValue = 150; // This could be a user setting
      const estimatedRevenue = leads?.filter(l => l.status === 'closed').length * avgTicketValue || 0;
      const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
      const roi = totalSpend > 0 ? ((estimatedRevenue - totalSpend) / totalSpend) * 100 : 0;

      const prevLeadsCount = prevLeads?.length || 0;
      const prevTotalSpend = prevSpend?.reduce((sum, s) => sum + Number(s.spend_amount), 0) || 0;
      const prevCpl = prevLeadsCount > 0 ? prevTotalSpend / prevLeadsCount : 0;

      const leadsChange = prevLeadsCount > 0 
        ? ((totalLeads - prevLeadsCount) / prevLeadsCount) * 100 
        : totalLeads > 0 ? 100 : 0;
      
      const cplChange = prevCpl > 0 
        ? ((prevCpl - cpl) / prevCpl) * 100 // Inverted: decrease is positive
        : cpl > 0 ? -100 : 0;

      return {
        totalLeads,
        leadsChange: Math.round(leadsChange * 10) / 10,
        costPerLead: Math.round(cpl * 100) / 100,
        cplChange: Math.round(cplChange * 10) / 10,
        estimatedRevenue,
        revenueChange: 0, // Would need historical revenue data
        roi: Math.round(roi),
        roiChange: 0,
        isRoiPositive: roi > 0,
      };
    },
    enabled: !!user?.id,
  });
};

// ============ CAMPAIGNS ============
export const useCampaigns = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCampaignsByPlatform = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['campaigns-by-platform', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      // Group by platform and aggregate
      const platforms = ['facebook', 'instagram', 'tiktok', 'google'] as const;
      
      return platforms.map(platform => {
        const platformCampaigns = data?.filter(c => c.platform === platform) || [];
        const totalLeads = platformCampaigns.reduce((sum, c) => sum + c.leads_count, 0);
        const totalSpent = platformCampaigns.reduce((sum, c) => sum + Number(c.total_spent), 0);
        const avgCpl = totalLeads > 0 ? totalSpent / totalLeads : 0;
        
        // Determine health based on CPL thresholds
        let health: 'healthy' | 'needs-optimization' | 'underperforming' = 'healthy';
        if (avgCpl > 10) health = 'underperforming';
        else if (avgCpl > 5) health = 'needs-optimization';

        return {
          platform,
          leads: totalLeads,
          costPerLead: Math.round(avgCpl * 100) / 100,
          status: health,
          campaignCount: platformCampaigns.length,
        };
      });
    },
    enabled: !!user?.id,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (campaign: Omit<TablesInsert<'campaigns'>, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...campaign, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-by-platform'] });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'campaigns'> & { id: string }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-by-platform'] });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns-by-platform'] });
    },
  });
};

// ============ LEADS ============
export const useLeads = (limit?: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['leads', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('leads')
        .select('*, campaigns(name, platform)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lead: Omit<TablesInsert<'leads'>, 'user_id'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...lead, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['adflow-stats'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'leads'> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['adflow-stats'] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['adflow-stats'] });
    },
  });
};

// ============ AD SPEND / CHART DATA ============
export const useChartData = (dateRange: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['chart-data', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return [];

      let days: number;
      
      switch (dateRange) {
        case 'today':
          days = 1;
          break;
        case '7days':
          days = 7;
          break;
        case '30days':
        default:
          days = 30;
          break;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: adSpend, error: spendError } = await supabase
        .from('ad_spend')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (spendError) throw spendError;

      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (leadsError) throw leadsError;

      // Generate data points for each day
      const chartData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const daySpend = adSpend?.filter(s => s.date === dateStr) || [];
        const dayLeads = leads?.filter(l => 
          l.created_at.split('T')[0] === dateStr
        ) || [];

        chartData.push({
          date: dayName,
          leads: dayLeads.length,
          adSpend: daySpend.reduce((sum, s) => sum + Number(s.spend_amount), 0),
        });
      }

      return chartData;
    },
    enabled: !!user?.id,
  });
};

// ============ AI INSIGHTS ============
export const useAIInsights = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-insights', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .eq('is_applied', false)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
};

export const useApplyInsight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_applied: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });
};

export const useDismissInsight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_dismissed: true })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });
};
