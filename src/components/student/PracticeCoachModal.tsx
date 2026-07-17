import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Loader2, Dumbbell, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { INSTRUMENT_PLAN_MAP, type InstrumentSlug } from '@/lib/instrument-access';

export const PracticeCoachModal = () => {
  const { data: userIns } = useUserInstrument();
  const primary = (userIns?.instrument ?? null) as InstrumentSlug | null;
  const defaultInstrumentLabel = primary ? INSTRUMENT_PLAN_MAP[primary]?.label : '';

  const [open, setOpen] = useState(false);
  const [instrument, setInstrument] = useState(defaultInstrumentLabel || 'Guitarra Acústica');
  const [level, setLevel] = useState('principiante');
  const [minutesPerDay, setMinutesPerDay] = useState(30);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [styles, setStyles] = useState('');
  const [goals, setGoals] = useState('');
  const [weakPoints, setWeakPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke('practice-coach', {
        body: { instrument, level, minutesPerDay, daysPerWeek, styles, goals, weakPoints },
      });
      if (error) throw error;
      if (data?.success && data.plan) {
        setPlan(data.plan);
      } else {
        throw new Error(data?.error || 'No se pudo generar el plan');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error inesperado';
      toast({ title: 'Error generando tu plan', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => setPlan(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Dumbbell className="w-4 h-4" />
          Coach de Práctica
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Coach de Práctica Personalizado
          </DialogTitle>
          <DialogDescription>
            Cuéntame sobre ti y armaré un plan de práctica semanal a tu medida.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {!plan ? (
            <ScrollArea className="h-full pr-3">
              <div className="space-y-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Instrumento</Label>
                    <Input value={instrument} onChange={(e) => setInstrument(e.target.value)} placeholder="Piano, Guitarra..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Nivel</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="principiante">Principiante</SelectItem>
                        <SelectItem value="intermedio bajo">Intermedio bajo</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="intermedio alto">Intermedio alto</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Minutos por día: <span className="text-primary font-semibold">{minutesPerDay}</span></Label>
                    <Slider value={[minutesPerDay]} onValueChange={(v) => setMinutesPerDay(v[0])} min={10} max={120} step={5} />
                  </div>
                  <div className="space-y-2">
                    <Label>Días por semana: <span className="text-primary font-semibold">{daysPerWeek}</span></Label>
                    <Slider value={[daysPerWeek]} onValueChange={(v) => setDaysPerWeek(v[0])} min={1} max={7} step={1} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estilos que te interesan</Label>
                  <Input value={styles} onChange={(e) => setStyles(e.target.value)} placeholder="Rock, jazz, bolero, funk..." />
                </div>

                <div className="space-y-2">
                  <Label>Tus objetivos</Label>
                  <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Ej: tocar mis canciones favoritas, improvisar sobre blues, sacar canciones de oído..." rows={3} />
                </div>

                <div className="space-y-2">
                  <Label>Puntos débiles / lo que te cuesta</Label>
                  <Textarea value={weakPoints} onChange={(e) => setWeakPoints(e.target.value)} placeholder="Ej: cambios de acordes rápidos, ritmo, lectura, memoria..." rows={2} />
                </div>

                <Button onClick={generate} disabled={loading || !instrument.trim()} className="w-full gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Generando tu plan...' : 'Generar mi plan de práctica'}
                </Button>
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col">
              <ScrollArea className="flex-1 pr-3">
                <div className="prose prose-sm dark:prose-invert max-w-none pb-4">
                  <ReactMarkdown>{plan}</ReactMarkdown>
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Nuevo plan
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(plan);
                    toast({ title: 'Plan copiado', description: 'Ya puedes pegarlo donde quieras.' });
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
