import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download, Eraser, FileMusic, Loader2, Mic, MicOff, Music2, Pause, Play, Plus,
  Save, Sparkles, Trash2, Undo2, Keyboard as KeyboardIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScoreCanvas, type NoteRef } from '@/components/score/ScoreCanvas';
import { DrumPad, FretboardPad, PianoPad, QuickNotesPad, StaffPad } from '@/components/score/InputPads';
import { useMidiInput } from '@/hooks/useMidiInput';
import { usePitchInput } from '@/hooks/usePitchInput';
import { useGenerateScore, useSaveScore } from '@/hooks/useScores';
import { exportMidi, exportMusicXml, exportPdf, exportPng } from '@/lib/score/export';
import { playScore, previewNote, type PlayHandle } from '@/lib/score/playback';
import {
  ARTICULATION_LABEL, DURATION_GLYPH, DURATION_LABEL, DYNAMICS, KEY_SIGNATURES, SCORE_INSTRUMENTS,
  TIME_SIGNATURES, autoTab, autoTabChord, beatsPerMeasure, emptyMeasure, fillMeasureWithRests,
  keyToMidi, measureBeats, newScore, noteBeats, transposeNote,
  type Articulation, type DrumPiece, type Dynamic, type NoteDuration, type ScoreDoc,
  type ScoreInstrument, type ScoreMeasure, type ScoreNote,
} from '@/lib/score/model';

const DURATIONS: NoteDuration[] = ['w', 'h', 'q', '8', '16', '32'];
const ARTICULATIONS: Articulation[] = ['staccato', 'accent', 'tenuto', 'marcato', 'fermata'];


interface Props {
  initialDoc?: ScoreDoc;
  defaultInstrument?: ScoreInstrument;
  onSaved?: (doc: ScoreDoc) => void;
}

export const ScoreEditor = ({ initialDoc, defaultInstrument = 'guitar', onSaved }: Props) => {
  const { toast } = useToast();
  const [doc, setDoc] = useState<ScoreDoc>(() => initialDoc ?? newScore(defaultInstrument));
  const [history, setHistory] = useState<ScoreDoc[]>([]);
  const [selected, setSelected] = useState<NoteRef | null>(null);
  const [activeMeasure, setActiveMeasure] = useState(0);
  const [duration, setDuration] = useState<NoteDuration>('q');
  const [dotted, setDotted] = useState(false);
  const [accidental, setAccidental] = useState<'' | '#' | 'b'>('');
  const [chordMode, setChordMode] = useState(false);
  const [metronome, setMetronome] = useState(true);
  const [playingRef, setPlayingRef] = useState<NoteRef | null>(null);
  const [clipboard, setClipboard] = useState<ScoreMeasure | null>(null);
  const [measuresPerRow, setMeasuresPerRow] = useState(2);
  const [shortcutsOn, setShortcutsOn] = useState(true);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiYoutube, setAiYoutube] = useState('');
  const [aiMeasures, setAiMeasures] = useState(8);
  const [aiLevel, setAiLevel] = useState('principiante');
  const playRef = useRef<PlayHandle | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const cfg = SCORE_INSTRUMENTS[doc.instrument];
  const save = useSaveScore();
  const generate = useGenerateScore();

  useEffect(() => { if (initialDoc) setDoc(initialDoc); }, [initialDoc]);

  const pushHistory = useCallback((prev: ScoreDoc) => {
    setHistory((h) => [...h.slice(-24), JSON.parse(JSON.stringify(prev))]);
  }, []);

  const update = useCallback((fn: (d: ScoreDoc) => ScoreDoc) => {
    setDoc((prev) => { pushHistory(prev); return fn(JSON.parse(JSON.stringify(prev))); });
  }, [pushHistory]);

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      setDoc(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  // ------------------------------------------------------------- inserción
  const targetMeasure = selected?.measure ?? activeMeasure;
  const chordTimer = useRef<{ t: number; ref: NoteRef | null }>({ t: 0, ref: null });

  const insertNote = useCallback((partial: Partial<ScoreNote> & { keys: string[] }, opts?: { mergeChord?: boolean }) => {
    const note: ScoreNote = {
      keys: partial.keys,
      duration: partial.duration ?? duration,
      dotted: partial.dotted ?? dotted,
      rest: partial.rest,
      tab: partial.tab,
      drums: partial.drums,
      chord: partial.chord,
      articulation: partial.articulation,
      dynamic: partial.dynamic,
    };
    if (cfg.tuning && !note.rest && !note.tab) {
      const midis = note.keys.map(keyToMidi);
      note.tab = midis.length > 1
        ? autoTabChord(midis, cfg.tuning)
        : [autoTab(midis[0], cfg.tuning) ?? { str: 1, fret: 0 }];
    }
    previewNote(doc, note);

    const mergeChord = (opts?.mergeChord ?? chordMode) && !note.rest;
    let nextSel: NoteRef | null = null;
    let nextMeasure = targetMeasure;

    update((d) => {
      while (d.content.measures.length <= targetMeasure) d.content.measures.push(emptyMeasure());
      const m = d.content.measures[targetMeasure];
      const cursor = selected && selected.measure === targetMeasure ? selected.index : m.notes.length - 1;

      // modo acorde: apila la nota sobre la figura del cursor
      if (mergeChord && m.notes.length) {
        const host = m.notes[Math.max(0, Math.min(cursor, m.notes.length - 1))];
        if (host && !host.rest) {
          host.keys = Array.from(new Set([...host.keys, ...note.keys]));
          if (cfg.tuning) host.tab = autoTabChord(host.keys.map(keyToMidi), cfg.tuning);
          if (cfg.isDrums) host.drums = Array.from(new Set([...(host.drums ?? []), ...(note.drums ?? [])])) as DrumPiece[];
          nextSel = { measure: targetMeasure, index: m.notes.indexOf(host) };
          return d;
        }
      }

      const insertAt = selected && selected.measure === targetMeasure ? selected.index + 1 : m.notes.length;
      const bar = beatsPerMeasure(d.time_signature);
      const atEnd = insertAt >= m.notes.length;

      if (atEnd && measureBeats(m) + noteBeats(note) > bar + 0.001) {
        // compás lleno → escribir en el siguiente compás
        const nextIndex = targetMeasure + 1;
        while (d.content.measures.length <= nextIndex) d.content.measures.push(emptyMeasure());
        d.content.measures[nextIndex].notes.push(note);
        nextMeasure = nextIndex;
        nextSel = { measure: nextIndex, index: d.content.measures[nextIndex].notes.length - 1 };
      } else {
        m.notes.splice(insertAt, 0, note);
        nextSel = { measure: targetMeasure, index: insertAt };
      }
      return d;
    });

    setActiveMeasure(nextMeasure);
    setSelected(nextSel);
    return nextSel;
  }, [cfg, chordMode, doc, dotted, duration, selected, targetMeasure, update]);

  const onPickKey = (key: string) => insertNote({ keys: [key] });
  const onPickFret = ({ key, tab }: { key: string; tab: { str: number; fret: number } }) =>
    insertNote({ keys: [key], tab: [tab] });
  const onToggleDrum = (p: DrumPiece) => insertNote({ keys: [], drums: [p] });

  /** Entrada MIDI en tiempo real: notas tocadas juntas (<120 ms) forman un acorde. */
  const onMidiNote = useCallback((key: string) => {
    const now = performance.now();
    const grouped = now - chordTimer.current.t < 120 && !!chordTimer.current.ref;
    const ref = insertNote({ keys: [key] }, { mergeChord: grouped || chordMode });
    chordTimer.current = { t: now, ref: ref ?? null };
  }, [chordMode, insertNote]);

  const midi = useMidiInput(onMidiNote);
  const pitch = usePitchInput((key) => onPickKey(key));

  const addRest = () => insertNote({ keys: [], rest: true }, { mergeChord: false });

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    update((d) => {
      d.content.measures[selected.measure]?.notes.splice(selected.index, 1);
      return d;
    });
    setSelected((s) => (s && s.index > 0 ? { measure: s.measure, index: s.index - 1 } : null));
  }, [selected, update]);

  const clearMeasure = () => {
    update((d) => { if (d.content.measures[targetMeasure]) d.content.measures[targetMeasure].notes = []; return d; });
    setSelected(null);
  };

  const addMeasure = () => update((d) => { d.content.measures.push(emptyMeasure()); return d; });
  const removeMeasure = () => update((d) => {
    if (d.content.measures.length > 1) d.content.measures.pop();
    return d;
  });

  const setChordLabel = (value: string) => {
    if (!selected) return;
    update((d) => {
      const n = d.content.measures[selected.measure]?.notes[selected.index];
      if (n) n.chord = value || undefined;
      return d;
    });
  };

  // ------------------------------------------------- edición estilo MuseScore
  const patchSelected = useCallback((fn: (n: ScoreNote) => void) => {
    if (!selected) return;
    update((d) => {
      const n = d.content.measures[selected.measure]?.notes[selected.index];
      if (n) fn(n);
      return d;
    });
  }, [selected, update]);

  const setSelectedDuration = useCallback((d: NoteDuration) => {
    setDuration(d);
    patchSelected((n) => { n.duration = d; });
  }, [patchSelected]);

  const toggleDot = useCallback(() => {
    setDotted((v) => !v);
    patchSelected((n) => { n.dotted = !n.dotted; });
  }, [patchSelected]);

  const toggleArticulation = (a: Articulation) =>
    patchSelected((n) => { n.articulation = n.articulation === a ? undefined : a; });

  const setDynamic = (d: Dynamic | '') =>
    patchSelected((n) => { n.dynamic = d || undefined; });

  const toggleTie = useCallback(() => patchSelected((n) => { n.tie = !n.tie; }), [patchSelected]);

  const setLyric = (value: string) => patchSelected((n) => { n.lyric = value || undefined; });

  /** Transpone la nota seleccionada, o todo el compás si no hay selección. */
  const transposeBy = useCallback((semis: number) => {
    update((d) => {
      const apply = (n: ScoreNote) => Object.assign(n, transposeNote(n, semis, cfg.tuning));
      if (selected) {
        const n = d.content.measures[selected.measure]?.notes[selected.index];
        if (n) apply(n);
      } else {
        d.content.measures[targetMeasure]?.notes.forEach(apply);
      }
      return d;
    });
  }, [cfg.tuning, selected, targetMeasure, update]);

  const moveCursor = useCallback((delta: number) => {
    setSelected((s) => {
      const measures = doc.content.measures;
      if (!s) {
        const m = measures[activeMeasure];
        if (!m?.notes.length) return s;
        return { measure: activeMeasure, index: delta > 0 ? 0 : m.notes.length - 1 };
      }
      let { measure, index } = s;
      index += delta;
      while (index < 0) {
        measure -= 1;
        if (measure < 0) return { measure: 0, index: 0 };
        index += measures[measure]?.notes.length ?? 0;
      }
      while (index >= (measures[measure]?.notes.length ?? 0)) {
        index -= measures[measure]?.notes.length ?? 0;
        measure += 1;
        if (measure >= measures.length) return { measure: measures.length - 1, index: Math.max(0, (measures[measures.length - 1]?.notes.length ?? 1) - 1) };
      }
      setActiveMeasure(measure);
      return { measure, index };
    });
  }, [activeMeasure, doc]);

  const copyMeasure = () => {
    setClipboard(JSON.parse(JSON.stringify(doc.content.measures[targetMeasure] ?? emptyMeasure())));
    toast({ title: `Compás ${targetMeasure + 1} copiado` });
  };

  const pasteMeasure = () => {
    if (!clipboard) return;
    update((d) => {
      while (d.content.measures.length <= targetMeasure) d.content.measures.push(emptyMeasure());
      d.content.measures[targetMeasure] = JSON.parse(JSON.stringify(clipboard));
      return d;
    });
    setSelected(null);
  };

  const fillRests = () => {
    update((d) => {
      d.content.measures = d.content.measures.map((m) =>
        (m.notes.length ? fillMeasureWithRests(m, d.time_signature) : m));
      return d;
    });
  };

  // referencias vivas para los atajos de teclado
  const undoRef = useRef(undo); undoRef.current = undo;
  const copyRef = useRef(copyMeasure); copyRef.current = copyMeasure;
  const pasteRef = useRef(pasteMeasure); pasteRef.current = pasteMeasure;
  const addRestRef = useRef(addRest); addRestRef.current = addRest;
  const insertRef = useRef(insertNote); insertRef.current = insertNote;




  // ------------------------------------------------------------- transporte
  const stop = useCallback(() => {
    playRef.current?.stop();
    playRef.current = null;
    setPlayingRef(null);
  }, []);

  const play = useCallback((fromMeasure = 0) => {
    stop();
    playRef.current = playScore(doc, {
      metronome,
      fromMeasure,
      onEvent: (e) => setPlayingRef(e ? { measure: e.measure, index: e.index } : null),
      onEnd: () => { playRef.current = null; setPlayingRef(null); },
    });
  }, [doc, metronome, stop]);

  useEffect(() => () => { playRef.current?.stop(); }, []);

  // ------------------------------------------------ atajos de teclado (MuseScore)
  useEffect(() => {
    if (!shortcutsOn) return;
    const LETTER_KEYS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
    const DUR_KEYS: Record<string, NoteDuration> = {
      '2': 'w', '3': 'h', '4': 'q', '5': '8', '6': '16', '7': '32',
    };
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      const k = e.key.toLowerCase();

      if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); undoRef.current(); return; }
      if ((e.metaKey || e.ctrlKey) && k === 'c') { e.preventDefault(); copyRef.current(); return; }
      if ((e.metaKey || e.ctrlKey) && k === 'v') { e.preventDefault(); pasteRef.current(); return; }
      if (e.metaKey || e.ctrlKey) return;

      if (DUR_KEYS[k]) { e.preventDefault(); setSelectedDuration(DUR_KEYS[k]); return; }
      if (k === '.') { e.preventDefault(); toggleDot(); return; }
      if (k === 'r') { e.preventDefault(); addRestRef.current(); return; }
      if (k === 't') { e.preventDefault(); toggleTie(); return; }
      if (k === ' ') { e.preventDefault(); playRef.current ? stop() : play(activeMeasure); return; }
      if (k === 'backspace' || k === 'delete') { e.preventDefault(); deleteSelected(); return; }
      if (k === 'arrowright') { e.preventDefault(); moveCursor(1); return; }
      if (k === 'arrowleft') { e.preventDefault(); moveCursor(-1); return; }
      if (k === 'arrowup') { e.preventDefault(); transposeBy(e.shiftKey ? 12 : 1); return; }
      if (k === 'arrowdown') { e.preventDefault(); transposeBy(e.shiftKey ? -12 : -1); return; }

      if (!cfg.isDrums && LETTER_KEYS.includes(k)) {
        e.preventDefault();
        const octave = cfg.clef === 'bass' ? 3 : 4;
        const acc = accidental;
        insertRef.current({ keys: [`${k}${acc}/${octave}`] });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [accidental, activeMeasure, cfg, deleteSelected, moveCursor, play, setSelectedDuration, shortcutsOn, stop, toggleDot, toggleTie, transposeBy]);


  // --------------------------------------------------------------- acciones
  const handleSave = async () => {
    const saved = await save.mutateAsync(doc);
    setDoc((d) => ({ ...d, id: saved.id, share_code: saved.share_code }));
    onSaved?.(saved);
  };

  const handleExport = async (kind: 'midi' | 'xml' | 'pdf' | 'png') => {
    try {
      if (kind === 'midi') exportMidi(doc);
      else if (kind === 'xml') exportMusicXml(doc);
      else if (!svgRef.current) throw new Error('sin partitura');
      else if (kind === 'pdf') await exportPdf(svgRef.current, doc);
      else await exportPng(svgRef.current, doc);
    } catch {
      toast({ title: 'Error al exportar', variant: 'destructive' });
    }
  };

  const runAi = async () => {
    const res = await generate.mutateAsync({
      prompt: aiPrompt,
      youtubeUrl: aiYoutube.trim() || undefined,
      instrument: doc.instrument,
      level: aiLevel,
      measures: aiMeasures,
      key: doc.key_signature,
      time: doc.time_signature,
      tempo: doc.tempo,
    });
    if (res?.doc) {
      pushHistory(doc);
      setDoc((d) => ({ ...res.doc, id: d.id, share_code: d.share_code }));
      setSelected(null);
      setActiveMeasure(0);
      setAiOpen(false);
      toast({ title: 'Partitura generada', description: res.notes ?? undefined });
    }
  };

  const totalBeats = useMemo(
    () => doc.content.measures.reduce((acc, m) => acc + measureBeats(m), 0),
    [doc],
  );

  const selectedNote = selected
    ? doc.content.measures[selected.measure]?.notes[selected.index]
    : undefined;

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <Card className="p-4 bg-card/70 border-white/10 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <Label className="text-xs">Título</Label>
            <Input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Instrumento</Label>
            <Select
              value={doc.instrument}
              onValueChange={(v) => {
                stop();
                setDoc({ ...doc, instrument: v as ScoreInstrument });
                setSelected(null);
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SCORE_INSTRUMENTS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tonalidad</Label>
            <Select value={doc.key_signature} onValueChange={(v) => setDoc({ ...doc, key_signature: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KEY_SIGNATURES.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Compás</Label>
              <Select value={doc.time_signature} onValueChange={(v) => setDoc({ ...doc, time_signature: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SIGNATURES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tempo</Label>
              <Input
                type="number" min={40} max={240} value={doc.tempo}
                onChange={(e) => setDoc({ ...doc, tempo: Number(e.target.value) || 90 })}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {playRef.current ? (
            <Button size="sm" variant="secondary" onClick={stop} className="gap-2">
              <Pause className="w-4 h-4" /> Detener
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={() => play(0)} className="gap-2">
                <Play className="w-4 h-4" /> Reproducir
              </Button>
              <Button size="sm" variant="outline" onClick={() => play(activeMeasure)} className="gap-2">
                <Play className="w-3.5 h-3.5" /> Desde compás {activeMeasure + 1}
              </Button>
            </>

          )}
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/40">
            <Switch id="metro" checked={metronome} onCheckedChange={setMetronome} />
            <Label htmlFor="metro" className="text-xs cursor-pointer">Metrónomo</Label>
          </div>
          <Button size="sm" variant="outline" onClick={undo} disabled={!history.length} className="gap-2">
            <Undo2 className="w-4 h-4" /> Deshacer
          </Button>
          <Button size="sm" onClick={handleSave} disabled={save.isPending} className="gap-2">
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
          </Button>

          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary" className="gap-2">
                <Sparkles className="w-4 h-4" /> Generar con IA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generar partitura con IA</DialogTitle>
                <DialogDescription>
                  Pega un link de YouTube o describe lo que necesitas: acordes, estilo, ejercicio o una canción.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Link de YouTube (opcional)</Label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={aiYoutube}
                    onChange={(e) => setAiYoutube(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    {aiYoutube.trim() ? 'Indicaciones extra (opcional)' : 'Descripción'}
                  </Label>
                  <Textarea
                    rows={4}
                    placeholder="Ej: progresión C–G–Am–F con arpegios sencillos, o un groove de rock lento"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Compases</Label>
                    <Input type="number" min={2} max={16} value={aiMeasures}
                      onChange={(e) => setAiMeasures(Number(e.target.value) || 8)} />
                  </div>
                  <div>
                    <Label className="text-xs">Nivel</Label>
                    <Select value={aiLevel} onValueChange={setAiLevel}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="principiante">Principiante</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={runAi} disabled={generate.isPending || (!aiPrompt.trim() && !aiYoutube.trim())} className="gap-2">
                  {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex flex-wrap gap-1.5 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleExport('pdf')} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('png')}>PNG</Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('midi')}>MIDI</Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('xml')} className="gap-1.5">
              <FileMusic className="w-3.5 h-3.5" /> MusicXML
            </Button>
          </div>
        </div>
      </Card>

      {/* Partitura */}
      <ScoreCanvas
        doc={doc}
        selected={selected}
        playing={playingRef}
        measuresPerRow={measuresPerRow}
        onSelectNote={(r) => { setSelected(r); setActiveMeasure(r.measure); }}
        onSelectMeasure={(m) => { setSelected(null); setActiveMeasure(m); }}
        svgRef={(svg) => { svgRef.current = svg; }}
      />

      {/* Edición */}
      <Card className="p-4 bg-card/70 border-white/10 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Figura:</span>
          {DURATIONS.map((d) => (
            <Button
              key={d}
              size="sm"
              title={`${DURATION_LABEL[d]} (${{ w: '2', h: '3', q: '4', '8': '5', '16': '6', '32': '7' }[d]})`}
              variant={duration === d ? 'default' : 'outline'}
              onClick={() => setSelectedDuration(d)}
            >
              <span className="text-base leading-none mr-1">{DURATION_GLYPH[d]}</span>
              <span className="hidden sm:inline">{DURATION_LABEL[d]}</span>
            </Button>
          ))}
          <Button size="sm" variant={dotted ? 'default' : 'outline'} onClick={toggleDot} title="Puntillo (.)">
            Puntillo
          </Button>
          {!cfg.isDrums && (
            <>
              <span className="text-xs text-muted-foreground ml-2">Alteración:</span>
              {([['', '♮'], ['#', '♯'], ['b', '♭']] as const).map(([v, l]) => (
                <Button key={v} size="sm" variant={accidental === v ? 'default' : 'outline'}
                  onClick={() => setAccidental(v)}>{l}</Button>
              ))}
            </>
          )}
          <Button size="sm" variant={chordMode ? 'default' : 'outline'} onClick={() => setChordMode(!chordMode)} className="gap-1.5">
            <Music2 className="w-3.5 h-3.5" /> Acorde
          </Button>
          <Button size="sm" variant="outline" onClick={addRest} title="Silencio (R)">Silencio</Button>
          <Button size="sm" variant={selectedNote?.tie ? 'default' : 'outline'} onClick={toggleTie} disabled={!selected} title="Ligadura (T)">
            Ligadura
          </Button>
          <Button size="sm" variant="outline" onClick={deleteSelected} disabled={!selected} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Borrar nota
          </Button>
          <Button size="sm" variant="outline" onClick={clearMeasure} className="gap-1.5">
            <Eraser className="w-3.5 h-3.5" /> Vaciar compás
          </Button>
        </div>

        {/* Articulaciones, dinámicas y transporte de altura */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Articulación:</span>
          {ARTICULATIONS.map((a) => (
            <Button
              key={a} size="sm" disabled={!selected}
              variant={selectedNote?.articulation === a ? 'default' : 'outline'}
              onClick={() => toggleArticulation(a)}
            >
              {ARTICULATION_LABEL[a]}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-2">Dinámica:</span>
          {DYNAMICS.map((d) => (
            <Button
              key={d} size="sm" disabled={!selected}
              variant={selectedNote?.dynamic === d ? 'default' : 'outline'}
              onClick={() => setDynamic(selectedNote?.dynamic === d ? '' : d)}
              className="italic font-serif"
            >
              {d}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selected ? 'Transponer nota:' : 'Transponer compás:'}
          </span>
          <Button size="sm" variant="outline" onClick={() => transposeBy(1)} className="gap-1"><ArrowUp className="w-3.5 h-3.5" />½</Button>
          <Button size="sm" variant="outline" onClick={() => transposeBy(-1)} className="gap-1"><ArrowDown className="w-3.5 h-3.5" />½</Button>
          <Button size="sm" variant="outline" onClick={() => transposeBy(12)}>+8va</Button>
          <Button size="sm" variant="outline" onClick={() => transposeBy(-12)}>−8va</Button>
          <Button size="sm" variant="outline" onClick={copyMeasure} className="gap-1.5">
            <Copy className="w-3.5 h-3.5" /> Copiar compás
          </Button>
          <Button size="sm" variant="outline" onClick={pasteMeasure} disabled={!clipboard} className="gap-1.5">
            <ClipboardPaste className="w-3.5 h-3.5" /> Pegar
          </Button>
          <Button size="sm" variant="outline" onClick={fillRests}>Completar con silencios</Button>
          <div className="flex items-center gap-2 ml-auto">
            <Label className="text-xs">Compases por línea</Label>
            <Select value={String(measuresPerRow)} onValueChange={(v) => setMeasuresPerRow(Number(v))}>
              <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">Compás activo: {targetMeasure + 1}</Badge>
          {selected && <Badge variant="secondary">Nota {selected.index + 1}</Badge>}
          <Badge variant="outline">{doc.content.measures.length} compases</Badge>
          <Badge variant="outline">{totalBeats} tiempos escritos</Badge>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/40">
            <Switch id="shortcuts" checked={shortcutsOn} onCheckedChange={setShortcutsOn} />
            <Label htmlFor="shortcuts" className="text-xs cursor-pointer">Atajos de teclado</Label>
          </div>
          <Button size="sm" variant="outline" onClick={addMeasure} className="gap-1.5 ml-auto">
            <Plus className="w-3.5 h-3.5" /> Compás
          </Button>
          <Button size="sm" variant="outline" onClick={removeMeasure}>Quitar último</Button>
        </div>

        {shortcutsOn && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Atajos:</strong> A–G escriben notas · 2–7 eligen la figura · <kbd>.</kbd> puntillo ·
            <kbd> R</kbd> silencio · <kbd>T</kbd> ligadura · ←/→ mueven el cursor · ↑/↓ transponen
            (con Shift, una octava) · <kbd>Espacio</kbd> reproduce · <kbd>⌘/Ctrl+Z</kbd> deshacer ·
            <kbd> ⌘/Ctrl+C/V</kbd> copiar/pegar compás.
          </p>
        )}

        {selectedNote && !cfg.isDrums && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-40">
              <Label className="text-xs">Acorde sobre la nota</Label>
              <Input
                value={selectedNote.chord ?? ''}
                placeholder="Cmaj7"
                onChange={(e) => setChordLabel(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label className="text-xs">Letra (sílaba)</Label>
              <Input
                value={selectedNote.lyric ?? ''}
                placeholder="ven-"
                onChange={(e) => setLyric(e.target.value)}
              />
            </div>
          </div>
        )}

      </Card>

      {/* Entrada de notas */}
      <Card className="p-4 bg-card/70 border-white/10">
        <Tabs defaultValue={cfg.isDrums ? 'inst' : 'staff'}>
          <TabsList className="flex flex-wrap h-auto">
            {!cfg.isDrums && <TabsTrigger value="staff">Pentagrama</TabsTrigger>}
            <TabsTrigger value="inst">
              {cfg.tuning ? 'Mástil' : cfg.isDrums ? 'Batería' : cfg.grandStaff ? 'Teclado' : 'Notas'}
            </TabsTrigger>
            {!cfg.isDrums && <TabsTrigger value="midi">MIDI</TabsTrigger>}
            {!cfg.isDrums && <TabsTrigger value="mic">Micrófono</TabsTrigger>}
          </TabsList>

          {!cfg.isDrums && (
            <TabsContent value="staff" className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Haz clic en la línea o el espacio donde quieres escribir la nota.
              </p>
              <StaffPad instrument={doc.instrument} accidental={accidental} onPick={onPickKey} />
            </TabsContent>
          )}

          <TabsContent value="inst" className="mt-3 space-y-2">
            {cfg.tuning ? (
              <FretboardPad instrument={doc.instrument} onPick={onPickFret} />
            ) : cfg.isDrums ? (
              <DrumPad active={selectedNote?.drums ?? []} onToggle={onToggleDrum} />
            ) : cfg.grandStaff ? (
              <PianoPad onPick={onPickKey} />
            ) : (
              <QuickNotesPad instrument={doc.instrument} accidental={accidental} onPick={onPickKey} />
            )}
          </TabsContent>

          {!cfg.isDrums && (
            <TabsContent value="midi" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Conecta tu teclado o controlador MIDI y toca: las notas se escriben solas.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {midi.enabled ? (
                  <Button size="sm" variant="secondary" onClick={midi.disable} className="gap-2">
                    <KeyboardIcon className="w-4 h-4" /> Desconectar MIDI
                  </Button>
                ) : (
                  <Button size="sm" onClick={midi.enable} className="gap-2">
                    <KeyboardIcon className="w-4 h-4" /> Conectar MIDI
                  </Button>
                )}
                {midi.devices.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}
              </div>
              {midi.error && <p className="text-xs text-destructive">{midi.error}</p>}
            </TabsContent>
          )}

          {!cfg.isDrums && (
            <TabsContent value="mic" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Canta o toca tu instrumento: detectamos el tono y lo escribimos en la partitura.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {pitch.listening ? (
                  <Button size="sm" variant="secondary" onClick={pitch.stop} className="gap-2">
                    <MicOff className="w-4 h-4" /> Detener micrófono
                  </Button>
                ) : (
                  <Button size="sm" onClick={pitch.start} className="gap-2">
                    <Mic className="w-4 h-4" /> Escuchar
                  </Button>
                )}
                {pitch.current && <Badge className="font-mono">{pitch.current}</Badge>}
              </div>
              {pitch.error && <p className="text-xs text-destructive">{pitch.error}</p>}
            </TabsContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default ScoreEditor;
