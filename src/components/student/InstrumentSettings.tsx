import { Save, Loader2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { INSTRUMENT_PLANS, type InstrumentSlug } from '@/lib/instrument-access';
import { useUserInstrument, useSetUserInstrument } from '@/hooks/useUserInstrument';

export const InstrumentSettings = () => {
  const { data, isLoading } = useUserInstrument();
  const updateMutation = useSetUserInstrument();
  const [selected, setSelected] = useState<InstrumentSlug | null>(null);

  useEffect(() => {
    if (data?.instrument) setSelected(data.instrument);
  }, [data?.instrument]);

  const canSave = !!selected && selected !== data?.instrument && !updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi instrumento</CardTitle>
        <CardDescription>
          Cada plan da acceso a un único instrumento. Cambiar tu instrumento actualiza los cursos,
          clases y herramientas de IA disponibles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-24 bg-muted/30 animate-pulse rounded-lg" />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {INSTRUMENT_PLANS.map((p) => {
                const isSel = selected === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      'relative rounded-lg border p-4 text-left transition-all',
                      isSel
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/5'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    {isSel && (
                      <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                    )}
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <div className="font-medium text-sm">{p.label}</div>
                    <div className="text-xs text-muted-foreground">${p.price}/mes</div>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => selected && updateMutation.mutate(selected)}
              disabled={!canSave}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar cambios
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
