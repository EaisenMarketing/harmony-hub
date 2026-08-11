import { useMemo, useState } from 'react';
import { Loader2, Download, TrendingUp, Users, XCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrialMetrics, useAdminGroups, useSaveGroupTrialLimit } from '@/hooks/useMembership';
import { PLAN_LABEL, WEEKDAYS } from '@/lib/membership';
import { downloadCsv } from '@/lib/csv';

const StatCard = ({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string | number; hint?: string }) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-black text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </CardContent>
  </Card>
);

const Breakdown = ({ title, rows }: { title: string; rows: { label: string; total: number; converted: number; rate: number }[] }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Sin datos aún.</p>}
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between text-sm">
          <span className="text-foreground capitalize">{r.label}</span>
          <span className="text-muted-foreground">{r.converted}/{r.total} · {r.rate}%</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

export const SubscriptionsDashboard = () => {
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today.toISOString().slice(0, 10));

  const { data, isLoading } = useTrialMetrics(`${from}T00:00:00Z`, `${to}T23:59:59Z`);
  const { data: groups } = useAdminGroups();
  const saveLimit = useSaveGroupTrialLimit();

  const csvRows = useMemo(() => (data?.rows ?? []).map((r) => ({
    alumno: r.full_name,
    plan: PLAN_LABEL(r.plan_key),
    instrumento: r.instrument_slug ?? '—',
    estado: r.status,
    pais: r.country,
    grupo: r.group_code,
    maestro: r.teacher_name,
    inicio: r.started_at,
    fin: r.ends_at,
  })), [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suscripciones y pruebas gratis</h1>
          <p className="text-muted-foreground mt-1">Trials, conversiones y cancelaciones de Acorde Live.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="m-from" className="text-xs">Desde</Label>
            <Input id="m-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label htmlFor="m-to" className="text-xs">Hasta</Label>
            <Input id="m-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadCsv('acorde-trials.csv', csvRows)} disabled={!csvRows.length}>
            <Download className="w-4 h-4 mr-2" />CSV
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard icon={<Users className="w-4 h-4 text-muted-foreground" />} label="Total trials" value={data.total} />
            <StatCard icon={<TrendingUp className="w-4 h-4 text-emerald-500" />} label="Trials activos" value={data.active} />
            <StatCard icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} label="Convertidos" value={data.converted} />
            <StatCard icon={<XCircle className="w-4 h-4 text-rose-500" />} label="Cancelados" value={data.canceled} />
            <StatCard icon={<TrendingUp className="w-4 h-4 text-primary" />} label="Conversión" value={`${data.conversionRate}%`} hint={`${data.converted} de ${data.total}`} />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Breakdown title="Conversión por instrumento" rows={data.byInstrument} />
            <Breakdown title="Conversión por plan" rows={data.byPlan} />
            <Breakdown title="Conversión por país" rows={data.byCountry} />
            <Breakdown title="Conversión por maestro" rows={data.byTeacher} />
            <Breakdown title="Conversión por grupo" rows={data.byGroup} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trials del periodo</CardTitle>
              <CardDescription>Detalle por alumno.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-4">Alumno</th><th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Instrumento</th><th className="py-2 pr-4">Grupo</th>
                    <th className="py-2 pr-4">Maestro</th><th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4">Termina</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 text-foreground">{r.full_name}</td>
                      <td className="py-2 pr-4">{PLAN_LABEL(r.plan_key)}</td>
                      <td className="py-2 pr-4 capitalize">{r.instrument_slug ?? '—'}</td>
                      <td className="py-2 pr-4">{r.group_code}</td>
                      <td className="py-2 pr-4">{r.teacher_name}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={r.status === 'converted' ? 'default' : r.status === 'canceled' ? 'destructive' : 'secondary'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{new Date(r.ends_at).toLocaleDateString('es-MX')}</td>
                    </tr>
                  ))}
                  {!data.rows.length && (
                    <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Sin trials en este rango.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cupos de prueba por grupo</CardTitle>
              <CardDescription>Máximo de alumnos en prueba que pueden integrarse a cada clase grupal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(groups ?? []).map((g) => (
                <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{g.name} — {g.code}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {g.instrument_slug} · {g.level_key} · {WEEKDAYS[g.weekday]} {String(g.start_time_utc).slice(0, 5)} UTC · cupo {g.capacity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min={0} max={g.capacity} defaultValue={g.trial_slots_limit}
                      className="h-9 w-20"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== g.trial_slots_limit) saveLimit.mutate({ id: g.id, limit: v });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">cupos de prueba</span>
                  </div>
                </div>
              ))}
              {!(groups ?? []).length && <p className="text-sm text-muted-foreground">Aún no hay grupos creados.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
