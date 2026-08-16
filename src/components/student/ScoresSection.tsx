import { useMemo, useState } from 'react';
import { ArrowLeft, FileMusic, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreEditor } from '@/components/score/ScoreEditor';
import { useDeleteScore, useMyScores } from '@/hooks/useScores';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { SCORE_INSTRUMENTS, newScore, type ScoreDoc, type ScoreInstrument } from '@/lib/score/model';

const toScoreInstrument = (v: string | null): ScoreInstrument =>
  (v && v in SCORE_INSTRUMENTS ? v : 'guitar') as ScoreInstrument;

export const ScoresSection = () => {
  const { data: scores, isLoading } = useMyScores();
  const { data: userInstrument } = useUserInstrument();
  const del = useDeleteScore();
  const [editing, setEditing] = useState<ScoreDoc | null>(null);

  const defaultInstrument = useMemo(
    () => toScoreInstrument(userInstrument?.instrument ?? null),
    [userInstrument],
  );

  if (editing) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Mis partituras
        </Button>
        <ScoreEditor
          initialDoc={editing.id ? editing : undefined}
          defaultInstrument={editing.instrument}
          onSaved={(saved) => setEditing(saved)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Creador de Partituras</h1>
          <p className="text-sm text-muted-foreground">
            Escribe partitura y tablatura, escúchala, genérala con IA y expórtala en PDF, MIDI o MusicXML.
          </p>
        </div>
        <Button onClick={() => setEditing(newScore(defaultInstrument))} className="gap-2">
          <Plus className="w-4 h-4" /> Nueva partitura
        </Button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !scores?.length ? (
        <Card className="p-10 text-center bg-card/60 border-white/10">
          <FileMusic className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground">Aún no tienes partituras</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crea una desde cero o pídele a la IA un ejercicio para tu instrumento.
          </p>
          <Button className="mt-4 gap-2" onClick={() => setEditing(newScore(defaultInstrument))}>
            <Plus className="w-4 h-4" /> Empezar
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {scores.map((s) => {
            const cfg = SCORE_INSTRUMENTS[s.instrument] ?? SCORE_INSTRUMENTS.guitar;
            return (
              <Card key={s.id} className="p-4 bg-card/70 border-white/10 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cfg.emoji} {cfg.label} · {s.key_signature} · {s.time_signature} · {s.tempo} BPM
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {s.content?.measures?.length ?? 0} comp.
                  </Badge>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Button size="sm" className="flex-1" onClick={() => setEditing(s)}>Abrir</Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => s.id && del.mutate(s.id)}
                    aria-label="Eliminar partitura"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScoresSection;
