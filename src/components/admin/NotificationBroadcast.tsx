import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Send, Megaphone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useBroadcastNotification } from '@/hooks/useNotifications';
import { PUBLIC_INSTRUMENTS } from '@/lib/instruments';

export const NotificationBroadcast = () => {
  const broadcast = useBroadcastNotification();
  const [form, setForm] = useState({ title: '', body: '', link: '', instrument: '' });

  const send = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Escribe un título', variant: 'destructive' });
      return;
    }
    try {
      const count = await broadcast.mutateAsync({
        title: form.title.trim(),
        body: form.body.trim() || undefined,
        link: form.link.trim() || undefined,
        instrument: form.instrument || undefined,
      });
      toast({ title: 'Notificación enviada', description: `Llegó a ${count} alumnos.` });
      setForm({ title: '', body: '', link: '', instrument: '' });
    } catch (e) {
      toast({
        title: 'No se pudo enviar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-5 bg-card/70 border-white/10 space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">Notificación a alumnos</h3>
          <p className="text-xs text-muted-foreground">
            Aparece al instante en la campana del portal de cada alumno.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Nueva clase en vivo este sábado"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Mensaje</Label>
        <Textarea
          rows={4}
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Detalles del aviso…"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Enlace interno (opcional)</Label>
          <Input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="/portal/calendario"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Filtrar por instrumento</Label>
          <select
            className="w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
            value={form.instrument}
            onChange={(e) => setForm({ ...form, instrument: e.target.value })}
          >
            <option value="">Todos los alumnos</option>
            {PUBLIC_INSTRUMENTS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={send} disabled={broadcast.isPending} className="w-full sm:w-auto">
        <Send className="w-4 h-4 mr-2" />
        {broadcast.isPending ? 'Enviando…' : 'Enviar notificación'}
      </Button>
    </Card>
  );
};
