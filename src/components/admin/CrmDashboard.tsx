import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Gift,
  Mail,
  TrendingUp,
  Download,
  Search,
  Phone,
  Instagram,
  MessageSquare,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

type UnifiedLead = {
  id: string;
  table: 'material_leads' | 'contact_leads';
  full_name: string;
  email: string;
  phone: string | null;
  instagram_handle: string | null;
  message: string | null;
  source: string;
  origin: string; // material title or "Formulario de contacto"
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo',
  nuevo: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  converted: 'Convertido',
  lost: 'Perdido',
  pending: 'Nuevo',
  resolved: 'Convertido',
};

const statusClass = (s: string) => {
  switch (s) {
    case 'converted':
    case 'resolved':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'qualified':
      return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
    case 'contacted':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'lost':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    default:
      return 'bg-primary/15 text-primary border-primary/30';
  }
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const CrmDashboard = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [rangeDays, setRangeDays] = useState('30');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['crm-leads'],
    queryFn: async (): Promise<UnifiedLead[]> => {
      const [materials, matLeads, contacts] = await Promise.all([
        supabase.from('free_materials').select('id, title, slug'),
        supabase
          .from('material_leads')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('contact_leads')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (matLeads.error) throw matLeads.error;
      if (contacts.error) throw contacts.error;

      const matMap = new Map(
        (materials.data || []).map((m) => [m.id, m.title as string])
      );

      const a: UnifiedLead[] = (matLeads.data || []).map((l) => ({
        id: l.id,
        table: 'material_leads',
        full_name: l.full_name,
        email: l.email,
        phone: l.phone,
        instagram_handle: l.instagram_handle,
        message: l.notes,
        source: l.source || 'landing',
        origin: (l.material_id && matMap.get(l.material_id)) || 'Material gratuito',
        status: l.status || 'new',
        created_at: l.created_at,
      }));

      const b: UnifiedLead[] = (contacts.data || []).map((l) => ({
        id: l.id,
        table: 'contact_leads',
        full_name: l.full_name,
        email: l.email,
        phone: l.phone,
        instagram_handle: null,
        message: l.message,
        source: l.source || 'contacto',
        origin: 'Formulario de contacto',
        status: l.status || 'new',
        created_at: l.created_at,
      }));

      return [...a, ...b].sort(
        (x, y) => +new Date(y.created_at) - +new Date(x.created_at)
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ lead, status }: { lead: UnifiedLead; status: string }) => {
      const { error } = await supabase
        .from(lead.table)
        .update({ status })
        .eq('id', lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm-leads'] });
      toast.success('Estado actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const origins = useMemo(
    () => Array.from(new Set(leads.map((l) => l.origin))),
    [leads]
  );

  const inRange = useMemo(() => {
    if (rangeDays === 'all') return leads;
    const cutoff = Date.now() - Number(rangeDays) * 86400000;
    return leads.filter((l) => +new Date(l.created_at) >= cutoff);
  }, [leads, rangeDays]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inRange.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (originFilter !== 'all' && l.origin !== originFilter) return false;
      if (!q) return true;
      return [l.full_name, l.email, l.phone, l.instagram_handle, l.origin]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [inRange, search, statusFilter, originFilter]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: inRange.length,
      today: inRange.filter((l) => new Date(l.created_at).toDateString() === today)
        .length,
      materials: inRange.filter((l) => l.table === 'material_leads').length,
      contact: inRange.filter((l) => l.table === 'contact_leads').length,
      converted: inRange.filter((l) =>
        ['converted', 'resolved'].includes(l.status)
      ).length,
    };
  }, [inRange]);

  const timeline = useMemo(() => {
    const days = rangeDays === 'all' ? 30 : Number(rangeDays);
    const buckets: { date: string; leads: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      buckets.push({
        date: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
        leads: 0,
      });
    }
    const idx = new Map(buckets.map((b, i) => [b.date, i]));
    inRange.forEach((l) => {
      const key = new Date(l.created_at).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
      });
      const i = idx.get(key);
      if (i !== undefined) buckets[i].leads++;
    });
    return buckets;
  }, [inRange, rangeDays]);

  const byOrigin = useMemo(() => {
    const map = new Map<string, number>();
    inRange.forEach((l) => map.set(l.origin, (map.get(l.origin) || 0) + 1));
    return Array.from(map, ([name, leads]) => ({ name, leads })).sort(
      (a, b) => b.leads - a.leads
    );
  }, [inRange]);

  const exportCsv = () => {
    const rows = [
      ['Nombre', 'Email', 'Teléfono', 'Instagram', 'Origen', 'Fuente', 'Estado', 'Fecha', 'Mensaje'],
      ...filtered.map((l) => [
        l.full_name,
        l.email,
        l.phone || '',
        l.instagram_handle || '',
        l.origin,
        l.source,
        STATUS_LABEL[l.status] || l.status,
        new Date(l.created_at).toISOString(),
        (l.message || '').replace(/\s+/g, ' '),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: 'Leads totales', value: stats.total, icon: Users },
    { label: 'Hoy', value: stats.today, icon: TrendingUp },
    { label: 'Material gratuito', value: stats.materials, icon: Gift },
    { label: 'Formulario contacto', value: stats.contact, icon: Mail },
    { label: 'Convertidos', value: stats.converted, icon: Link2 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Leads por día</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="crmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="hsl(var(--primary))"
                  fill="url(#crmGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por enlace / origen</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {byOrigin.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos aún</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byOrigin} layout="vertical" margin={{ left: 8 }}>
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono o IG..."
              className="pl-9"
            />
          </div>
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger className="md:w-52"><SelectValue placeholder="Origen" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los orígenes</SelectItem>
              {origins.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </CardContent>
      </Card>

      {/* Leads list */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Leads ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay leads con estos filtros todavía.
            </p>
          )}
          {filtered.map((l) => (
            <div
              key={`${l.table}-${l.id}`}
              className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{l.full_name}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(l.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusClass(l.status)}>
                    {STATUS_LABEL[l.status] || l.status}
                  </Badge>
                  <Select
                    value={STATUS_OPTIONS.includes(l.status) ? l.status : 'new'}
                    onValueChange={(status) => updateStatus.mutate({ lead: l, status })}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                <a href={`mailto:${l.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0" /> {l.email}
                </a>
                {l.phone && (
                  <a
                    href={`https://wa.me/${l.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" /> {l.phone}
                  </a>
                )}
                {l.instagram_handle && (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Instagram className="w-3.5 h-3.5 shrink-0" /> {l.instagram_handle}
                  </span>
                )}
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Gift className="w-3.5 h-3.5 shrink-0" /> {l.origin}
                </span>
              </div>

              {l.message && (
                <p className="flex gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="whitespace-pre-wrap">{l.message}</span>
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CrmDashboard;
