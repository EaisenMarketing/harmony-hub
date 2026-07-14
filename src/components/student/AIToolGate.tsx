import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { INSTRUMENT_PLAN_MAP, type InstrumentSlug } from '@/lib/instrument-access';

interface Props {
  toolName: string;
  /** Instruments allowed to use the tool. If null/empty → allowed for all. */
  allowedInstruments?: InstrumentSlug[] | null;
  children: React.ReactNode;
  buttonLabel: string;
  icon?: React.ReactNode;
  variant?: 'outline' | 'secondary' | 'default';
}

/**
 * Wraps an AI tool trigger. If the user's instrument grants access, renders `children`.
 * Otherwise renders a locked button that opens a dialog explaining how to unlock.
 */
export const AIToolGate = ({
  toolName,
  allowedInstruments,
  children,
  buttonLabel,
  icon,
  variant = 'outline',
}: Props) => {
  const navigate = useNavigate();
  const { data: userIns } = useUserInstrument();
  const primary = userIns?.instrument ?? null;
  const [open, setOpen] = useState(false);

  const allowed = useMemo(() => {
    if (!allowedInstruments || allowedInstruments.length === 0) return !!primary;
    return !!primary && allowedInstruments.includes(primary);
  }, [allowedInstruments, primary]);

  if (allowed) return <>{children}</>;

  const currentLabel = primary ? INSTRUMENT_PLAN_MAP[primary]?.label : 'ninguno';
  const allowedLabels = (allowedInstruments ?? [])
    .map((i) => INSTRUMENT_PLAN_MAP[i]?.label)
    .filter(Boolean)
    .join(', ');

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)} className="gap-2 opacity-90">
        <Lock className="w-4 h-4" />
        {buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-2">
              {icon ?? <Lock className="w-6 h-6 text-muted-foreground" />}
            </div>
            <DialogTitle>{toolName} bloqueado</DialogTitle>
            <DialogDescription>
              {primary
                ? `Tu plan actual es de ${currentLabel} y esta herramienta está disponible para: ${allowedLabels || 'otro instrumento'}.`
                : 'Necesitas elegir un instrumento antes de usar esta herramienta.'}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Puedes cambiar de instrumento en tu configuración o actualizar tu plan si quieres acceder a este contenido.
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); navigate('/portal/configuracion'); }}>
              Cambiar instrumento
            </Button>
            <Button onClick={() => { setOpen(false); navigate('/precios'); }}>
              Ver planes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
