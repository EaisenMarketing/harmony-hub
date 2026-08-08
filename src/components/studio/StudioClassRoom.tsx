import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, ExternalLink, Copy, KeyRound, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { StudioLiveClass } from '@/hooks/useTeacherStudio';

interface Props {
  liveClass: StudioLiveClass | null;
  onClose: () => void;
  studioName?: string;
}

/**
 * Sala de clase dentro de la plataforma.
 * Zoom no permite incrustarse en un iframe por seguridad (X-Frame-Options),
 * así que la clase se abre en una pestaña de Zoom desde este panel,
 * manteniendo dentro de Acorde Live los datos, el temario y el acceso.
 */
export const StudioClassRoom = ({ liveClass, onClose, studioName }: Props) => {
  if (!liveClass) return null;

  const date = new Date(liveClass.scheduled_at);
  const startsIn = Math.round((date.getTime() - Date.now()) / 60000);
  const live =
    Date.now() >= date.getTime() - 10 * 60 * 1000 &&
    Date.now() <= date.getTime() + (liveClass.duration_minutes ?? 60) * 60 * 1000;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copiado' });
    } catch {
      toast({ title: 'Copia manualmente', description: text });
    }
  };

  return (
    <Dialog open={!!liveClass} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            {liveClass.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            {live ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">En vivo ahora</Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {startsIn > 0 ? `Comienza en ${startsIn} min` : 'Finalizada'}
              </Badge>
            )}
            <span>
              {format(date, "EEEE d 'de' MMMM · HH:mm 'hrs'", { locale: es })} ·{' '}
              {liveClass.duration_minutes} min
            </span>
          </div>

          {studioName && <p className="text-xs text-muted-foreground">Estudio: {studioName}</p>}
          {liveClass.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{liveClass.description}</p>
          )}

          <div className="rounded-xl border border-white/10 bg-primary/5 p-4 space-y-3">
            {liveClass.join_url ? (
              <>
                <Button className="w-full" size="lg" asChild>
                  <a href={liveClass.join_url} target="_blank" rel="noreferrer">
                    <Video className="w-4 h-4 mr-2" />
                    Entrar a la clase por Zoom
                  </a>
                </Button>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copy(liveClass.join_url!)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar enlace
                  </Button>
                  {liveClass.meeting_id && (
                    <Button size="sm" variant="outline" onClick={() => copy(liveClass.meeting_id!)}>
                      ID: {liveClass.meeting_id}
                    </Button>
                  )}
                  {liveClass.passcode && (
                    <Button size="sm" variant="outline" onClick={() => copy(liveClass.passcode!)}>
                      <KeyRound className="w-4 h-4 mr-2" />
                      {liveClass.passcode}
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Zoom se abre en una ventana nueva (Zoom no permite incrustarse dentro de otra web por
                  seguridad). Todo lo demás —temario, tareas y progreso— se queda aquí en Acorde Live.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta clase todavía no tiene enlace de Zoom asignado.
              </p>
            )}
          </div>

          {liveClass.recording_url && (
            <Button variant="outline" className="w-full" asChild>
              <a href={liveClass.recording_url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver grabación de la clase
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
