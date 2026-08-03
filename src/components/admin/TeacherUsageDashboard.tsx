import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeacherUsageMetrics, type TeacherUsageRow } from '@/hooks/useTeacherStudio';
import { TEACHER_PLAN_MAP, TEACHER_STATUS_LABEL, type TeacherPlanId } from '@/lib/teacher-plans';
import { downloadCsv } from '@/lib/csv';
import { toast } from 'sonner';
import { Download, Wallet, Users, Activity, Mail, ArrowUpDown } from 'lucide-react';

type SortKey = 'mrr' | 'seats_used' | 'lessons_completed' | 'invites_sent' | 'last_activity';

const RANGES = [
  { id: '7', label: 'Últimos 7 días' },
  { id: '30', label: 'Últimos 30 días' },
  { id: '90', label: 'Últimos 90 días' },
  { id: 'all', label: 'Todo el histórico' },
  { id: 'custom', label: 'Rango personalizado' },
];

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

export const TeacherUsageDashboard = () => {
  const [range, setRange] = useState('30');
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(today());
  const [sort, setSort] = useState<SortKey>('mrr');
  const [statusFilter, setStatusFilter] = useState('all');

  const effFrom = range === 'all' ? undefined : range === 'custom' ? from : isoDaysAgo(Number(range));
  const effTo = range === 'all' ? undefined : range === 'custom' ? to : today();

  const { data, isLoading } = useTeacherUsageMetrics(effFrom, effTo);
  const rows = data?.rows ?? [];
  const totals = data?.totals;

  const visible = useMemo(() => {
    const list = rows.filter((r) => statusFilter === 'all' || r.status === statusFilter);
    return [...list].sort((a, b) => {
      if (sort === 'last_activity') {
        return (b.last_activity ?? '').localeCompare(a.last_activity ?? '');
      }
      return (b[sort] as number) - (a[sort] as number);
    });
  }, [rows, statusFilter, sort]);

  const exportCsv = () => {
    if (!visible.length) {
      toast.error('No hay datos para exportar');
      return;
    }
    const payload = visible.map((r: TeacherUsageRow) => ({
      Estudio: r.studio_name,
      Email: r.contact_email ?? '',
      Instrumento: r.primary_instrument ?? '',
      Plan: TEACHER_PLAN_MAP[(r.plan as TeacherPlanId) ?? 'starter']?.label ?? r.plan,
      Estado: TEACHER_STATUS_LABEL[r.status] ?? r.status,
      'MRR USD': r.mrr,
      'Cupos usados': r.seats_used,
      'Cupos plan': r.seat_limit,
      'Ocupación %': r.seats_pct,
      'Invitaciones (rango)': r.invites_sent,
      'Alumnos activados (rango)': r.students_joined,
      Cursos: r.courses,
      'Cursos publicados': r.published_courses,
      Lecciones: r.lessons,
      'Lecciones completadas (rango)': r.lessons_completed,
      'Tareas (rango)': r.assignments,
      'Tareas atendidas (rango)': r.assignments_completed,
      'Última actividad': r.last_activity ? new Date(r.last_activity).toLocaleDateString('es-MX') : '',
      'Alta del estudio': new Date(r.created_at).toLocaleDateString('es-MX'),
    }));
    downloadCsv(`uso-maestros-${effFrom ?? 'inicio'}_${effTo ?? today()}`, payload);
    toast.success('CSV descargado');
  };

  const metrics = [
    { label: 'MRR real (activos)', value: `$${totals?.mrr ?? 0}`, icon: Wallet },
    { label: 'MRR potencial (prueba)', value: `$${totals?.trialMrr ?? 0}`, icon: Wallet },
    {
      label: 'Asientos ocupados',
      value: `${totals?.seatsUsed ?? 0} / ${totals?.seatsTotal ?? 0}`,
      icon: Users,
    },
    {
      label: 'Invitaciones / activaciones',
      value: `${totals?.invites ?? 0} / ${totals?.joined ?? 0}`,
      icon: Mail,
    },
    {
      label: 'Actividad (lecciones · tareas)',
      value: `${totals?.lessonsCompleted ?? 0} · ${totals?.assignments ?? 0}`,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Rango de fechas */}
      <Card className="p-4 bg-card/70 border-white/10 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Rango de medición</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {range === 'custom' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Desde</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hasta</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Estado</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.keys(TEACHER_STATUS_LABEL).map((s) => (
                  <SelectItem key={s} value={s}>
                    {TEACHER_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="p-4 bg-card/70 border-white/10">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <m.icon className="w-4 h-4" />
              <span className="truncate">{m.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground mt-1">{m.value}</p>
          </Card>
        ))}
      </div>

      {/* Orden */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-56 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mrr">Mayor MRR</SelectItem>
            <SelectItem value="seats_used">Más asientos usados</SelectItem>
            <SelectItem value="lessons_completed">Más actividad de alumnos</SelectItem>
            <SelectItem value="invites_sent">Más invitaciones</SelectItem>
            <SelectItem value="last_activity">Actividad más reciente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla / tarjetas */}
      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground bg-card/70 border-white/10">
          Cargando métricas de uso…
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground bg-card/70 border-white/10">
          No hay maestros que cumplan estos filtros.
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <Card key={r.id} className="p-4 bg-card/70 border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{r.studio_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.contact_email ?? 'Sin email'} · {TEACHER_PLAN_MAP[(r.plan as TeacherPlanId) ?? 'starter']?.label}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
                    ${r.mrr}/mes
                  </Badge>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {TEACHER_STATUS_LABEL[r.status] ?? r.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { l: 'Asientos', v: `${r.seats_used}/${r.seat_limit} (${r.seats_pct}%)` },
                  { l: 'Invitaciones', v: r.invites_sent },
                  { l: 'Alumnos activados', v: r.students_joined },
                  { l: 'Cursos publicados', v: `${r.published_courses}/${r.courses}` },
                  { l: 'Lecciones completadas', v: r.lessons_completed },
                  { l: 'Tareas asignadas', v: r.assignments },
                  { l: 'Tareas atendidas', v: r.assignments_completed },
                  {
                    l: 'Última actividad',
                    v: r.last_activity ? new Date(r.last_activity).toLocaleDateString('es-MX') : 'Sin actividad',
                  },
                ].map((x) => (
                  <div key={x.l} className="rounded-lg bg-white/[0.03] border border-white/5 p-2">
                    <p className="text-muted-foreground">{x.l}</p>
                    <p className="text-foreground font-semibold">{x.v}</p>
                  </div>
                ))}
              </div>

              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, r.seats_pct)}%` }} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
