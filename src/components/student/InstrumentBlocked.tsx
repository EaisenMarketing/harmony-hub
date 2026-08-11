import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  /** Instrumento activo del alumno, para regresarlo a su contenido. */
  activeInstrument?: string | null;
}

/** Pantalla de acceso denegado cuando el contenido pertenece a otro instrumento. */
export const InstrumentBlocked = ({ activeInstrument }: Props) => (
  <div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="max-w-md text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">Este contenido pertenece a otro instrumento.</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Tu membresía está asociada a un solo instrumento
        {activeInstrument ? '. Regresa a tu contenido para seguir aprendiendo.' : '.'}
      </p>
      <Button asChild>
        <Link to="/portal">VOLVER A MI INSTRUMENTO</Link>
      </Button>
    </div>
  </div>
);
