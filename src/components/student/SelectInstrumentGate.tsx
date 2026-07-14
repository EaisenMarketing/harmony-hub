import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { INSTRUMENT_PLANS, type InstrumentSlug } from '@/lib/instrument-access';
import { useSetUserInstrument } from '@/hooks/useUserInstrument';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
}

export const SelectInstrumentGate = ({ open }: Props) => {
  const [selected, setSelected] = useState<InstrumentSlug | null>(null);
  const setInstrument = useSetUserInstrument();

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Elige tu instrumento</DialogTitle>
          <DialogDescription>
            Cada plan da acceso a un instrumento. Selecciona el que vas a estudiar; podrás cambiarlo
            más adelante desde Configuración.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {INSTRUMENT_PLANS.map((p) => {
            const isSel = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={cn(
                  'relative rounded-xl border p-4 text-left transition-all bg-card',
                  isSel
                    ? 'border-primary ring-2 ring-primary/40 shadow-lg'
                    : 'border-border hover:border-primary/50 hover:shadow-md',
                )}
              >
                {isSel && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <div className="text-3xl mb-2">{p.emoji}</div>
                <div className="font-semibold text-foreground">{p.label}</div>
                <div className="text-xs text-muted-foreground mt-1">${p.price}/mes</div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            size="lg"
            disabled={!selected || setInstrument.isPending}
            onClick={() => selected && setInstrument.mutate(selected)}
          >
            {setInstrument.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando…
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
