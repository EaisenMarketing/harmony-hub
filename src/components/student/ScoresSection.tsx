import { useMemo, useState } from 'react';
import { ArrowLeft, Eye, FileMusic, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScoreEditor } from '@/components/score/ScoreEditor';
import { ScoreThumbnail } from '@/components/score/ScoreThumbnail';
import { useDeleteScore, useMyScores } from '@/hooks/useScores';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { SCORE_INSTRUMENTS, beatsPerMeasure, newScore, type ScoreDoc, type ScoreInstrument } from '@/lib/score/model';

const toScoreInstrument = (v: string | null): ScoreInstrument =>
  (v && v in SCORE_INSTRUMENTS ? v : 'guitar') as ScoreInstrument;

const GROUP_LABEL: Record<ScoreInstrument, string> = {
  drums: 'Drum Group',
  guitar: 'Guitarra / Cuerdas',
  electric_guitar: 'Guitarra / Cuerdas',
  bass: 'Bajo / Cuerdas',
  piano: 'Teclados',
  trumpet: 'Metales',
};

const MEASURES_PER_PAGE = 12;

const pages = (doc: ScoreDoc) =>
  Math.max(1, Math.ceil((doc.content?.measures?.length || 1) / MEASURES_PER_PAGE));

const duration = (doc: ScoreDoc) => {
  const beats = (doc.content?.measures?.length || 0) * beatsPerMeasure(doc.time_signature);
  const secs = Math.round((beats / Math.max(30, doc.tempo)) * 60);
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
};

export const ScoresSection = () => {
  const { data: scores, isLoading } = useMyScores();
  const { data: userInstrument } = useUserInstrument();
  const del = useDeleteScore();
  const [editing, setEditing] = useState<ScoreDoc | null>(null);
  const [q, setQ] = useState('');

  const defaultInstrument = useMemo(
    () => toScoreInstrument(userInstrument?.instrument ?? null),
    [userInstrument],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return scores ?? [];
    return (scores ?? []).filter((s) => s.title.toLowerCase().includes(t));
  }, [scores, q]);

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
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Partituras de {SCORE_INSTRUMENTS[defaultInstrument].label}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tu biblioteca: escribe, escucha, genera con IA y exporta en PDF, MIDI o MusicXML.
            </p>
          </div>
          <Button onClick={() => setEditing(newScore(defaultInstrument))} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva partitura
          </Button>
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título…"
            className="pl-9 bg-card/60 border-white/10"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !filtered.length ? (
        <Card className="p-10 text-center bg-card/60 border-white/10">
          <FileMusic className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-foreground">
            {q ? 'Sin resultados' : 'Aún no tienes partituras'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {q ? 'Prueba con otro título.' : 'Crea una desde cero o pídele a la IA un ejercicio para tu instrumento.'}
          </p>
          {!q && (
            <Button className="mt-4 gap-2" onClick={() => setEditing(newScore(defaultInstrument))}>
              <Plus className="w-4 h-4" /> Empezar
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => {
            const cfg = SCORE_INSTRUMENTS[s.instrument] ?? SCORE_INSTRUMENTS.guitar;
            return (
              <article key={s.id} className="group flex flex-col gap-3">
                <button
                  onClick={() => setEditing(s)}
                  className="relative block rounded-xl overflow-hidden border border-white/10 shadow-lg shadow-black/40 transition-transform duration-300 hover:-translate-y-1 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Abrir ${s.title}`}
                >
                  <ScoreThumbnail doc={s} />
                  <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3 h-3" /> Abrir
                  </span>
                </button>

                <div className="space-y-1.5">
                  <h3 className="font-semibold text-foreground leading-snug line-clamp-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    1 parte • {pages(s)} {pages(s) === 1 ? 'página' : 'páginas'} • {duration(s)} •{' '}
                    {s.content?.measures?.length ?? 0} compases
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.key_signature} • {s.time_signature} • {s.tempo} BPM
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {cfg.emoji} {cfg.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-white/15">Solo</Badge>
                    <Badge variant="outline" className="text-[10px] border-white/15">
                      {GROUP_LABEL[s.instrument] ?? 'Ensamble'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1" onClick={() => setEditing(s)}>Abrir</Button>
                    <Button
                      size="sm" variant="outline"
                      onClick={() => s.id && del.mutate(s.id)}
                      aria-label="Eliminar partitura"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScoresSection;
