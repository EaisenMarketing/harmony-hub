import { Piano, Guitar, Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useEnabledInstruments,
  useUpdateEnabledInstruments,
  type Instrument,
} from '@/hooks/useEnabledInstruments';

export const InstrumentSettings = () => {
  const { data, isLoading } = useEnabledInstruments();
  const updateMutation = useUpdateEnabledInstruments();
  const [selected, setSelected] = useState<Instrument[]>([]);

  useEffect(() => {
    if (data?.instruments) setSelected(data.instruments);
  }, [data?.instruments]);

  const toggle = (inst: Instrument) => {
    setSelected((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const canSave = selected.length > 0 && !updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Piano className="w-5 h-5 text-primary" />
          Mis instrumentos
        </CardTitle>
        <CardDescription>
          Elige qué instrumentos estás aprendiendo. Solo verás las herramientas de IA (generador de acordes, sheets,
          detector por foto) del instrumento que tengas seleccionado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-24 bg-muted/30 animate-pulse rounded-lg" />
        ) : (
          <>
            {data?.isUnset && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
                Aún no has elegido tus instrumentos. Mientras tanto puedes usar todas las herramientas.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition ${
                  selected.includes('piano')
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox
                  checked={selected.includes('piano')}
                  onCheckedChange={() => toggle('piano')}
                />
                <Piano className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Piano</p>
                  <p className="text-xs text-muted-foreground">Acordes, sheets y herramientas de piano</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition ${
                  selected.includes('guitar')
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox
                  checked={selected.includes('guitar')}
                  onCheckedChange={() => toggle('guitar')}
                />
                <Guitar className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Guitarra</p>
                  <p className="text-xs text-muted-foreground">Acordes, diagramas y herramientas de guitarra</p>
                </div>
              </label>
            </div>

            <Button
              onClick={() => updateMutation.mutate(selected)}
              disabled={!canSave}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
            {selected.length === 0 && (
              <p className="text-xs text-destructive">Selecciona al menos un instrumento.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
