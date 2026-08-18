import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Music, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Seo } from '@/lib/seo';

const LeadCapturePage = () => {
  const { code } = useParams<{ code: string }>();
  const [studio, setStudio] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', instrument: '', message: '' });

  useEffect(() => {
    if (!code) return;
    supabase
      .from('teacher_accounts')
      .select('studio_name')
      .eq('invite_code', code)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.studio_name) setStudio(data.studio_name);
        else setInvalid(true);
      });
  }, [code]);

  const submit = async () => {
    if (!form.full_name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast({ title: 'Escribe tu nombre y un email válido', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.rpc('submit_teacher_lead', {
        _invite_code: code!,
        _full_name: form.full_name.trim(),
        _email: form.email.trim(),
        _phone: form.phone.trim() || null,
        _instrument: form.instrument.trim() || null,
        _message: form.message.trim() || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.ok) throw new Error(row?.message ?? 'No se pudo registrar');
      setDone(true);
    } catch (e) {
      toast({ title: 'No se pudo enviar', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Seo
        title={`Clases de música con ${studio ?? 'tu maestro'} | Acorde Live`}
        description="Déjanos tus datos y tu maestro te contactará para agendar tu clase de prueba."
      />
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/15">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{studio ?? 'Clases de música'}</h1>
            <p className="text-xs text-muted-foreground">Agenda tu clase de prueba</p>
          </div>
        </div>

        {invalid ? (
          <p className="text-sm text-muted-foreground">
            Este enlace no es válido. Pídele a tu maestro el enlace correcto.
          </p>
        ) : done ? (
          <div className="text-center space-y-2 py-6">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
            <p className="font-semibold">¡Listo, recibimos tus datos!</p>
            <p className="text-sm text-muted-foreground">Tu maestro te contactará muy pronto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre completo</Label>
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
              <Label>¿Algo que quieras contarnos?</Label>
              <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button className="w-full" onClick={submit} disabled={sending}>
              {sending ? 'Enviando…' : 'Quiero mi clase de prueba'}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Al enviar aceptas recibir información sobre las clases. Puedes darte de baja cuando quieras.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LeadCapturePage;
