import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Mail, Plus, Search, Trash2, UserPlus, Phone, MessageSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { TeacherAccount } from '@/hooks/useTeacherStudio';
import {
  LEAD_STAGES,
  stageLabel,
  useAddLeadActivity,
  useDeleteTeacherLead,
  useLeadActivities,
  useSaveTeacherLead,
  useSendLeadEmail,
  useTeacherLeads,
  type LeadStage,
  type TeacherLead,
} from '@/hooks/useTeacherCrm';

const stageStyles: Record<string, string> = {
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  contacted: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  trial: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  enrolled: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  lost: 'bg-white/10 text-white/60 border-white/20',
};

export const StudioCrm = ({ account }: { account: TeacherAccount }) => {
  const { data: leads = [], isLoading } = useTeacherLeads(account.id);
  const save = useSaveTeacherLead();
  const remove = useDeleteTeacherLead();
  const sendEmail = useSendLeadEmail();
  const addActivity = useAddLeadActivity();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | LeadStage>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [emailLead, setEmailLead] = useState<TeacherLead | null>(null);
  const [detailLead, setDetailLead] = useState<TeacherLead | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    instrument: '',
    notes: '',
    marketing_opt_in: true,
  });
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [note, setNote] = useState('');

  const { data: activities = [] } = useLeadActivities(detailLead?.id);

  const captureUrl = `${window.location.origin}/clases/${account.invite_code}`;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (stageFilter !== 'all' && l.stage !== stageFilter) return false;
      if (!q) return true;
      return [l.full_name, l.email, l.phone, l.instrument].some((v) => v?.toLowerCase().includes(q));
    });
  }, [leads, search, stageFilter]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: leads.length };
    for (const s of LEAD_STAGES) base[s.key] = leads.filter((l) => l.stage === s.key).length;
    return base;
  }, [leads]);

  const submitLead = async () => {
    if (!form.full_name.trim()) {
      toast({ title: 'Escribe el nombre del prospecto', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        teacher_account_id: account.id,
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        instrument: form.instrument.trim() || account.primary_instrument,
        notes: form.notes.trim() || null,
        marketing_opt_in: form.marketing_opt_in,
      });
      toast({ title: 'Prospecto agregado' });
      setFormOpen(false);
      setForm({ full_name: '', email: '', phone: '', instrument: '', notes: '', marketing_opt_in: true });
    } catch (e) {
      toast({ title: 'No se pudo guardar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const changeStage = async (lead: TeacherLead, stage: LeadStage) => {
    await save.mutateAsync({ id: lead.id, teacher_account_id: account.id, stage });
    setDetailLead((d) => (d && d.id === lead.id ? { ...d, stage } : d));
  };

  const submitEmail = async () => {
    if (!emailLead) return;
    if (emailForm.subject.trim().length < 2 || emailForm.message.trim().length < 2) {
      toast({ title: 'Falta asunto o mensaje', variant: 'destructive' });
      return;
    }
    try {
      await sendEmail.mutateAsync({
        accountId: account.id,
        leadId: emailLead.id,
        subject: emailForm.subject.trim(),
        message: emailForm.message.trim(),
      });
      toast({ title: 'Correo enviado', description: emailLead.email ?? '' });
      setEmailLead(null);
      setEmailForm({ subject: '', message: '' });
    } catch (e) {
      toast({ title: 'No se pudo enviar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const submitNote = async () => {
    if (!detailLead || !note.trim()) return;
    await addActivity.mutateAsync({
      lead_id: detailLead.id,
      teacher_account_id: account.id,
      type: 'note',
      note: note.trim(),
    });
    setNote('');
    toast({ title: 'Seguimiento registrado' });
  };

  return (
    <div className="space-y-4">
      {/* Link de captura */}
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="w-4 h-4 text-primary" /> Tu página para captar alumnos
        </div>
        <p className="text-xs text-muted-foreground">
          Comparte este enlace en redes o WhatsApp. Cada registro entra directo a tu CRM.
        </p>
        <div className="flex gap-2">
          <Input readOnly value={captureUrl} className="text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(captureUrl);
              toast({ title: 'Enlace copiado' });
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar prospecto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo prospecto
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ key: 'all' as const, label: 'Todos' }, ...LEAD_STAGES].map((s) => (
          <button
            key={s.key}
            onClick={() => setStageFilter(s.key as 'all' | LeadStage)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition ${
              stageFilter === s.key ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'
            }`}
          >
            {s.label} ({counts[s.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando prospectos…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <p className="text-sm font-medium">Aún no hay prospectos aquí</p>
          <p className="text-xs text-muted-foreground">Agrégalos a mano o comparte tu enlace de captación.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((lead) => (
            <Card key={lead.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <button className="text-left min-w-0" onClick={() => setDetailLead(lead)}>
                  <p className="font-semibold truncate">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lead.email ?? 'Sin email'}</p>
                </button>
                <Badge variant="outline" className={stageStyles[lead.stage]}>
                  {stageLabel(lead.stage)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {lead.phone}
                  </span>
                )}
                {lead.instrument && <span>{lead.instrument}</span>}
                <span>
                  {lead.last_contacted_at
                    ? `Contactado hace ${formatDistanceToNow(new Date(lead.last_contacted_at), { locale: es })}`
                    : 'Sin contactar'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={lead.stage} onValueChange={(v) => changeStage(lead, v as LeadStage)}>
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-8"
                  disabled={!lead.email}
                  onClick={() => {
                    setEmailLead(lead);
                    setEmailForm({ subject: '', message: '' });
                  }}
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </Button>
                <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => setDetailLead(lead)}>
                  <MessageSquare className="w-3.5 h-3.5" /> Seguimiento
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-destructive"
                  onClick={async () => {
                    await remove.mutateAsync(lead.id);
                    toast({ title: 'Prospecto eliminado' });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Nuevo prospecto */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo prospecto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Instrumento</Label>
                <Input value={form.instrument} onChange={(e) => setForm({ ...form, instrument: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notas</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Acepta recibir promociones</Label>
              <Switch
                checked={form.marketing_opt_in}
                onCheckedChange={(v) => setForm({ ...form, marketing_opt_in: v })}
              />
            </div>
            <Button className="w-full" onClick={submitLead} disabled={save.isPending}>
              Guardar prospecto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email individual */}
      <Dialog open={!!emailLead} onOpenChange={(o) => !o && setEmailLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escribir a {emailLead?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Asunto</Label>
              <Input value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Mensaje</Label>
              <Textarea
                rows={6}
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Se envía con el nombre de tu estudio y las respuestas llegan a tu correo de contacto.
            </p>
            <Button className="w-full" onClick={submitEmail} disabled={sendEmail.isPending}>
              {sendEmail.isPending ? 'Enviando…' : 'Enviar correo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalle / seguimiento */}
      <Dialog open={!!detailLead} onOpenChange={(o) => !o && setDetailLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{detailLead?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{detailLead?.email ?? 'Sin email'}</p>
              {detailLead?.phone && <p>{detailLead.phone}</p>}
              {detailLead?.message && <p className="italic">“{detailLead.message}”</p>}
              {detailLead?.notes && <p>{detailLead.notes}</p>}
            </div>
            <div className="space-y-1">
              <Label>Agregar seguimiento</Label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Llamé, quedó de avisar…" />
              <Button size="sm" onClick={submitNote} disabled={addActivity.isPending}>
                Registrar
              </Button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin actividad registrada.</p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="text-xs border-l-2 border-primary/40 pl-3 py-1">
                    <p className="font-medium">{a.type === 'email' ? 'Correo enviado' : 'Nota'}</p>
                    {a.note && <p className="text-muted-foreground">{a.note}</p>}
                    <p className="text-[10px] text-muted-foreground">
                      hace {formatDistanceToNow(new Date(a.created_at), { locale: es })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
