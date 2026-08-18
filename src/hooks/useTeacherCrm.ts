import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type LeadStage = 'new' | 'contacted' | 'trial' | 'enrolled' | 'lost';

export interface TeacherLead {
  id: string;
  teacher_account_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  instrument: string | null;
  source: string;
  stage: LeadStage;
  notes: string | null;
  message: string | null;
  marketing_opt_in: boolean;
  last_contacted_at: string | null;
  converted_student_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  teacher_account_id: string;
  type: string;
  note: string | null;
  created_at: string;
}

export interface TeacherCampaign {
  id: string;
  teacher_account_id: string;
  name: string;
  subject: string;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  audience: 'leads' | 'students' | 'all';
  stage_filter: string | null;
  status: 'draft' | 'sending' | 'sent';
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

export const LEAD_STAGES: { key: LeadStage; label: string }[] = [
  { key: 'new', label: 'Nuevo' },
  { key: 'contacted', label: 'Contactado' },
  { key: 'trial', label: 'Clase de prueba' },
  { key: 'enrolled', label: 'Inscrito' },
  { key: 'lost', label: 'Perdido' },
];

export const stageLabel = (s: string) => LEAD_STAGES.find((x) => x.key === s)?.label ?? s;

/* ------------------------------- Leads ---------------------------------- */

export const useTeacherLeads = (accountId?: string) =>
  useQuery({
    queryKey: ['teacher-leads', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_leads')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeacherLead[];
    },
    enabled: !!accountId,
  });

export const useSaveTeacherLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lead: Partial<TeacherLead> & { teacher_account_id: string }) => {
      if (lead.id) {
        const { id, ...rest } = lead;
        const { data, error } = await supabase.from('teacher_leads').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const row = {
        teacher_account_id: lead.teacher_account_id,
        full_name: lead.full_name ?? '',
        email: lead.email ?? null,
        phone: lead.phone ?? null,
        instrument: lead.instrument ?? null,
        notes: lead.notes ?? null,
        message: lead.message ?? null,
        marketing_opt_in: lead.marketing_opt_in ?? true,
        source: lead.source ?? 'manual',
        stage: lead.stage ?? 'new',
      };
      const { data, error } = await supabase.from('teacher_leads').insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-leads'] }),
  });
};

export const useDeleteTeacherLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-leads'] }),
  });
};

export const useLeadActivities = (leadId?: string) =>
  useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_lead_activities')
        .select('*')
        .eq('lead_id', leadId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LeadActivity[];
    },
    enabled: !!leadId,
  });

export const useAddLeadActivity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lead_id: string; teacher_account_id: string; type: string; note?: string }) => {
      const { error } = await supabase.from('teacher_lead_activities').insert(input);
      if (error) throw error;
      await supabase
        .from('teacher_leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', input.lead_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-activities'] });
      qc.invalidateQueries({ queryKey: ['teacher-leads'] });
    },
  });
};

export const useSendLeadEmail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { accountId: string; leadId: string; subject: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke('send-crm-email', { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-leads'] });
      qc.invalidateQueries({ queryKey: ['lead-activities'] });
    },
  });
};

/* ------------------------------ Campañas -------------------------------- */

export const useTeacherCampaigns = (accountId?: string) =>
  useQuery({
    queryKey: ['teacher-campaigns', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_campaigns')
        .select('*')
        .eq('teacher_account_id', accountId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeacherCampaign[];
    },
    enabled: !!accountId,
  });

export const useSaveCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<TeacherCampaign> & { teacher_account_id: string }) => {
      if (c.id) {
        const { id, ...rest } = c;
        const { data, error } = await supabase.from('teacher_campaigns').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from('teacher_campaigns').insert(c).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-campaigns'] }),
  });
};

export const useDeleteCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-campaigns'] }),
  });
};

export const useSendCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { accountId: string; campaignId: string }) => {
      const { data, error } = await supabase.functions.invoke('send-crm-email', { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { sent: number; failed: number; recipients: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['teacher-campaigns'] }),
  });
};

/* ---------------------------- Historial email --------------------------- */

export const useStudioEmailLog = (accountId?: string) =>
  useQuery({
    queryKey: ['studio-email-log', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_log')
        .select('id, template, recipient_email, subject, status, error_message, created_at')
        .eq('teacher_account_id', accountId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!accountId,
  });
