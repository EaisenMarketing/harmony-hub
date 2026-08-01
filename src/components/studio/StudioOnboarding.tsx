import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Music, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';
import { TEACHER_PLANS, type TeacherPlanId } from '@/lib/teacher-plans';
import { useCreateTeacherAccount } from '@/hooks/useTeacherStudio';
import { toast } from '@/hooks/use-toast';

export const StudioOnboarding = ({ initialPlan }: { initialPlan?: TeacherPlanId }) => {
  const [studioName, setStudioName] = useState('');
  const [instrument, setInstrument] = useState<string>('guitar');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [plan, setPlan] = useState<TeacherPlanId>(initialPlan ?? 'starter');
  const create = useCreateTeacherAccount();

  const submit = async () => {
    if (studioName.trim().length < 3) {
      toast({ title: 'Ponle nombre a tu estudio', description: 'Mínimo 3 caracteres.', variant: 'destructive' });
      return;
    }
    try {
      await create.mutateAsync({ studio_name: studioName.trim(), primary_instrument: instrument, phone, bio, plan });
      toast({ title: '¡Tu estudio está listo!', description: 'Tienes 14 días de prueba para invitar a tus alumnos.' });
    } catch (e) {
      toast({
        title: 'No se pudo crear el estudio',
        description: e instanceof Error ? e.message : 'Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 md:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-primary/15">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Crea tu estudio de música</h1>
          <p className="text-muted-foreground text-sm">
            Da de alta tu estudio, invita a tus alumnos y usa todas las herramientas de Acorde Live con ellos.
            Empiezas con 14 días de prueba, sin tarjeta.
          </p>
        </div>

        <Card className="p-5 space-y-5 bg-card/70 border-white/10">
          <div className="space-y-2">
            <Label>Nombre de tu estudio o academia</Label>
            <Input
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              placeholder="Ej. Estudio Guitarra Méndez"
            />
          </div>

          <div className="space-y-2">
            <Label>Instrumento principal que enseñas</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {INSTRUMENT_PLANS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setInstrument(i.id)}
                  className={cn(
                    'shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition-colors',
                    instrument === i.id
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-white/10 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="mr-1">{i.emoji}</span>
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Teléfono / WhatsApp (opcional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 ..." />
          </div>

          <div className="space-y-2">
            <Label>Cuéntale a tus alumnos quién eres (opcional)</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {TEACHER_PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={cn(
                    'text-left p-3 rounded-xl border transition-colors',
                    plan === p.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/25',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{p.label}</span>
                    {plan === p.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ${p.price}/mes · {p.seats} alumnos
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear mi estudio y empezar la prueba
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            El cobro de la suscripción se activará cuando habilitemos pagos; por ahora tu estudio queda en modo prueba.
          </p>
        </Card>
      </div>
    </div>
  );
};
