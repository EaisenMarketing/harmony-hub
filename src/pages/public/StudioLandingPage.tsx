import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Music, CheckCircle2, Sparkles, Video, ClipboardList } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Seo } from '@/lib/seo';
import { useStudioPublicProfile } from '@/hooks/useTeacherStudio';
import { INSTRUMENT_PLAN_MAP } from '@/lib/instrument-access';
import NotFound from '@/pages/NotFound';

const BENEFITS = [
  { icon: Video, title: 'Clases y videos', text: 'Cursos grabados y clases en vivo con tu maestro.' },
  { icon: ClipboardList, title: 'Tareas y avance', text: 'Tu maestro te asigna práctica y revisa tu progreso.' },
  { icon: Sparkles, title: 'Herramientas de IA', text: 'Coach de práctica, oído, acordes, teoría y partituras.' },
];

const StudioLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: studio, isLoading } = useStudioPublicProfile(slug);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '' });

  const submit = async () => {
    if (!form.full_name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast({ title: 'Escribe tu nombre y un email válido', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.rpc('submit_teacher_lead', {
        _invite_code: studio!.invite_code,
        _full_name: form.full_name.trim(),
        _email: form.email.trim(),
        _phone: form.phone.trim() || null,
        _instrument: studio?.primary_instrument ?? null,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!studio) return <NotFound />;

  const instrument = studio.primary_instrument ? INSTRUMENT_PLAN_MAP[studio.primary_instrument]?.label : null;

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`${studio.studio_name} | Clases de música en línea`}
        description={`Toma clases con ${studio.studio_name}${instrument ? ` de ${instrument}` : ''}. Cursos, clases en vivo y herramientas de IA de Acorde Live.`}
      />
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <header className="text-center space-y-3">
          {studio.avatar_url ? (
            <img
              src={studio.avatar_url}
              alt={`Foto de ${studio.studio_name}`}
              className="w-20 h-20 rounded-2xl object-cover mx-auto"
              loading="lazy"
            />
          ) : (
            <div className="inline-flex p-4 rounded-2xl bg-primary/15">
              <Music className="w-7 h-7 text-primary" />
            </div>
          )}
          <h1 className="text-3xl font-bold text-foreground">{studio.studio_name}</h1>
          {instrument && <p className="text-sm text-primary">Clases de {instrument}</p>}
          {studio.bio && <p className="text-sm text-muted-foreground max-w-xl mx-auto">{studio.bio}</p>}
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {BENEFITS.map((b) => (
            <Card key={b.title} className="p-4 bg-card/70 border-white/10 space-y-2">
              <b.icon className="w-5 h-5 text-primary" />
              <p className="text-sm font-semibold text-foreground">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.text}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-card/70 border-white/10 max-w-md mx-auto space-y-4">
          {done ? (
            <div className="text-center space-y-2 py-4">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
              <p className="font-semibold text-foreground">¡Listo, recibimos tus datos!</p>
              <p className="text-sm text-muted-foreground">{studio.studio_name} te contactará muy pronto.</p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-bold text-foreground">Agenda tu clase de prueba</h2>
                <p className="text-xs text-muted-foreground">Déjanos tus datos y te contactamos.</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nombre completo</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Teléfono (opcional)</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>¿Algo que quieras contarnos?</Label>
                  <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <Button className="w-full" onClick={submit} disabled={sending}>
                  {sending ? 'Enviando…' : 'Quiero mi clase de prueba'}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  ¿Ya eres alumno de {studio.studio_name}?{' '}
                  <Link to={`/${slug}/unirme`} className="text-primary underline">
                    Activa tu acceso aquí
                  </Link>
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudioLandingPage;
