import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Plus, Send, Trash2, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { TeacherAccount } from '@/hooks/useTeacherStudio';
import {
  LEAD_STAGES,
  useDeleteCampaign,
  useSaveCampaign,
  useSendCampaign,
  useStudioEmailLog,
  useTeacherCampaigns,
  type TeacherCampaign,
} from '@/hooks/useTeacherCrm';

const emptyForm = {
  name: '',
  subject: '',
  body: '',
  cta_label: '',
  cta_url: '',
  audience: 'leads' as 'leads' | 'students' | 'all',
  stage_filter: 'all',
};

export const StudioCampaigns = ({ account }: { account: TeacherAccount }) => {
  const { data: campaigns = [], isLoading } = useTeacherCampaigns(account.id);
  const { data: log = [] } = useStudioEmailLog(account.id);
  const save = useSaveCampaign();
  const remove = useDeleteCampaign();
  const send = useSendCampaign();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState<TeacherCampaign | null>(null);

  const submit = async () => {
    if (form.name.trim().length < 2 || form.subject.trim().length < 2 || form.body.trim().length < 5) {
      toast({ title: 'Completa nombre, asunto y mensaje', variant: 'destructive' });
      return;
    }
    try {
      await save.mutateAsync({
        teacher_account_id: account.id,
        name: form.name.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
        cta_label: form.cta_label.trim() || null,
        cta_url: form.cta_url.trim() || null,
        audience: form.audience,
        stage_filter: form.audience === 'students' || form.stage_filter === 'all' ? null : form.stage_filter,
      });
      toast({ title: 'Campaña guardada como borrador' });
      setOpen(false);
      setForm(emptyForm);
    } catch (e) {
      toast({ title: 'No se pudo guardar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const doSend = async () => {
    if (!confirm) return;
    try {
      const res = await send.mutateAsync({ accountId: account.id, campaignId: confirm.id });
      toast({ title: 'Campaña enviada', description: `${res.sent} enviados · ${res.failed} fallidos` });
    } catch (e) {
      toast({ title: 'No se pudo enviar', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" /> Campañas de correo
          </h2>
          <p className="text-xs text-muted-foreground">
            Promociones y avisos a tus prospectos y alumnos. Se respeta la lista de bajas automáticamente.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Nueva
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando campañas…</p>
      ) : campaigns.length === 0 ? (
        <Card className="p-8 text-center space-y-1">
          <p className="text-sm font-medium">Todavía no has creado campañas</p>
          <p className="text-xs text-muted-foreground">Crea una promoción y envíala a tus prospectos en un clic.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {campaigns.map((c) => (
            <Card key={c.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.subject}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    c.status === 'sent'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-white/10 text-white/70 border-white/20'
                  }
                >
                  {c.status === 'sent' ? 'Enviada' : 'Borrador'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{c.body}</p>
              <div className="text-[11px] text-muted-foreground">
                {c.audience === 'leads' ? 'Prospectos' : c.audience === 'students' ? 'Alumnos' : 'Prospectos y alumnos'}
                {c.stage_filter ? ` · ${LEAD_STAGES.find((s) => s.key === c.stage_filter)?.label}` : ''}
                {c.status === 'sent' && c.sent_at
                  ? ` · ${c.sent_count}/${c.recipients_count} enviados el ${format(new Date(c.sent_at), "d 'de' MMM", { locale: es })}`
                  : ''}
              </div>
              <div className="flex gap-2">
                {c.status !== 'sent' && (
                  <Button size="sm" className="gap-1 h-8" onClick={() => setConfirm(c)}>
                    <Send className="w-3.5 h-3.5" /> Enviar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-destructive"
                  onClick={async () => {
                    await remove.mutateAsync(c.id);
                    toast({ title: 'Campaña eliminada' });
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Historial de envíos */}
      {log.length > 0 && (
        <Card className="p-4 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Últimos envíos
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {log.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 text-xs border-b border-border/50 py-1.5">
                <div className="min-w-0">
                  <p className="truncate">{l.recipient_email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{l.subject ?? l.template}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    l.status === 'sent'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : l.status === 'suppressed'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-red-500/15 text-red-300 border-red-500/30'
                  }
                >
                  {l.status === 'sent' ? 'Enviado' : l.status === 'suppressed' ? 'Dado de baja' : 'Falló'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Formulario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva campaña</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre interno</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Asunto</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Mensaje</Label>
              <Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Texto del botón</Label>
                <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Link del botón</Label>
                <Input value={form.cta_url} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Destinatarios</Label>
              <Select
                value={form.audience}
                onValueChange={(v) => setForm({ ...form, audience: v as typeof form.audience })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads">Prospectos</SelectItem>
                  <SelectItem value="students">Mis alumnos</SelectItem>
                  <SelectItem value="all">Prospectos y alumnos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.audience !== 'students' && (
              <div className="space-y-1">
                <Label>Etapa de los prospectos</Label>
                <Select value={form.stage_filter} onValueChange={(v) => setForm({ ...form, stage_filter: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="w-full" onClick={submit} disabled={save.isPending}>
              Guardar borrador
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar “{confirm?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              El correo saldrá con el nombre de tu estudio a los destinatarios seleccionados que aceptan promociones.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doSend} disabled={send.isPending}>
              {send.isPending ? 'Enviando…' : 'Enviar ahora'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
