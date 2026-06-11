import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Send, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const TeacherApplicationPage = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    instrument: 'guitar',
    years_experience: 1,
    bio: '',
    presentation_video_url: '',
    sample_class_url: '',
    availability: '',
    timezone: 'America/Mexico_City',
    accepted: false,
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accepted) {
      toast({ title: 'Acepta los términos', variant: 'destructive' });
      return;
    }
    if (form.bio.length < 60) {
      toast({ title: 'Biografía muy corta', description: 'Mínimo 60 caracteres.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('instructor_applications').insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        instrument: form.instrument,
        years_experience: form.years_experience,
        bio: form.bio,
        presentation_video_url: form.presentation_video_url || null,
        sample_class_url: form.sample_class_url || null,
        availability: form.availability || null,
        timezone: form.timezone,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: (err as Error).message || 'No se pudo enviar la aplicación.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Acorde Live" className="w-9 h-9 rounded-lg" />
            <span className="font-bold">Acorde Live</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Inicio</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Aplica como Maestro</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Únete a Acorde Live y enseña música a estudiantes de toda Latinoamérica. Clases en vivo por Zoom, herramientas
            de IA, y una comunidad activa de aprendizaje.
          </p>
        </div>

        {submitted ? (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">¡Aplicación enviada!</h2>
              <p className="text-muted-foreground">
                Recibimos tu solicitud. Nuestro equipo la revisará y te contactaremos al correo{' '}
                <span className="font-medium text-foreground">{form.email}</span> en los próximos días.
              </p>
              <Button asChild>
                <Link to="/">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Formulario de aplicación</CardTitle>
              <CardDescription>Cuéntanos sobre ti y tu experiencia enseñando música.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre completo *</Label>
                    <Input required value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Correo electrónico *</Label>
                    <Input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+52 55..." />
                  </div>
                  <div>
                    <Label>Instrumento principal *</Label>
                    <Select value={form.instrument} onValueChange={(v) => update('instrument', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guitar">Guitarra</SelectItem>
                        <SelectItem value="piano">Piano</SelectItem>
                        <SelectItem value="production">Producción Musical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Años de experiencia *</Label>
                    <Input
                      required type="number" min={0} max={70}
                      value={form.years_experience}
                      onChange={(e) => update('years_experience', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Zona horaria</Label>
                    <Select value={form.timezone} onValueChange={(v) => update('timezone', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Mexico_City">CDMX (GMT-6)</SelectItem>
                        <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                        <SelectItem value="America/Lima">Lima (GMT-5)</SelectItem>
                        <SelectItem value="America/Santiago">Santiago (GMT-3)</SelectItem>
                        <SelectItem value="America/Buenos_Aires">Buenos Aires (GMT-3)</SelectItem>
                        <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Biografía profesional * <span className="text-xs text-muted-foreground">(mín. 60 caracteres)</span></Label>
                  <Textarea
                    required rows={5}
                    placeholder="Cuéntanos tu experiencia, estudios, dónde has tocado/enseñado, qué te apasiona enseñar..."
                    value={form.bio}
                    onChange={(e) => update('bio', e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Video de presentación (URL)</Label>
                    <Input
                      type="url"
                      placeholder="YouTube o Vimeo"
                      value={form.presentation_video_url}
                      onChange={(e) => update('presentation_video_url', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Clase de muestra (URL)</Label>
                    <Input
                      type="url"
                      placeholder="YouTube, Vimeo o Drive"
                      value={form.sample_class_url}
                      onChange={(e) => update('sample_class_url', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Disponibilidad horaria</Label>
                  <Textarea
                    rows={3}
                    placeholder="Ej: lunes a viernes de 4pm a 9pm, sábados de 10am a 2pm..."
                    value={form.availability}
                    onChange={(e) => update('availability', e.target.value)}
                  />
                </div>

                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.accepted}
                    onChange={(e) => update('accepted', e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Acepto que Acorde Live revise mi información y me contacte sobre el proceso de selección.
                  </span>
                </label>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Enviar aplicación
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TeacherApplicationPage;
