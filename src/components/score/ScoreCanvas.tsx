import { useEffect, useRef } from 'react';
import {
  Accidental, Annotation, Articulation, Beam, Dot, Formatter, Renderer, Stave, StaveNote, StaveTie,
  TabNote, TabStave, Voice,
} from 'vexflow';
import {
  ARTICULATION_CODE, DRUM_MAP, SCORE_INSTRUMENTS, beatsPerMeasure, keyToMidi, measureBeats,
  type ScoreDoc, type ScoreMeasure, type ScoreNote,
} from '@/lib/score/model';


export interface NoteRef { measure: number; index: number }

interface Props {
  doc: ScoreDoc;
  selected?: NoteRef | null;
  playing?: NoteRef | null;
  measuresPerRow?: number;
  onSelectNote?: (ref: NoteRef) => void;
  onSelectMeasure?: (measure: number) => void;
  svgRef?: (svg: SVGSVGElement | null) => void;
}

const MEASURE_W = 260;
const LEFT_PAD = 12;

function cssVarColor(el: HTMLElement, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v ? (v.startsWith('#') || v.startsWith('rgb') ? v : `hsl(${v})`) : fallback;
}

function toVfDuration(n: ScoreNote): string {
  return `${n.duration}${n.rest ? 'r' : ''}`;
}

function restKey(clef: string): string {
  return clef === 'bass' ? 'd/3' : clef === 'percussion' ? 'c/5' : 'b/4';
}

export const ScoreCanvas = ({
  doc, selected, playing, measuresPerRow = 2, onSelectNote, onSelectMeasure, svgRef,
}: Props) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const hitsRef = useRef<{ x: number; y: number; w: number; h: number; ref: NoteRef }[]>([]);
  const measureHitsRef = useRef<{ x: number; y: number; w: number; h: number; measure: number }[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';
    hitsRef.current = [];
    measureHitsRef.current = [];

    const cfg = SCORE_INSTRUMENTS[doc.instrument];
    const ink = cssVarColor(host, '--score-ink', '#111827');
    const accent = cssVarColor(host, '--primary', '#10b981');

    const perRow = Math.max(1, measuresPerRow);
    const measures = doc.content.measures.length ? doc.content.measures : [{ notes: [] }];
    const rows = Math.ceil(measures.length / perRow);
    const rowH = cfg.tuning ? 250 : cfg.grandStaff ? 220 : 140;
    const width = LEFT_PAD * 2 + perRow * MEASURE_W + 40;
    const height = rows * rowH + 30;

    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    ctx.setFillStyle(ink);
    ctx.setStrokeStyle(ink);

    const beatsBar = beatsPerMeasure(doc.time_signature);
    const [numBeats, beatValue] = doc.time_signature.split('/').map(Number);

    measures.forEach((m, mi) => {
      const row = Math.floor(mi / perRow);
      const col = mi % perRow;
      const isFirstOfRow = col === 0;
      const x = LEFT_PAD + col * MEASURE_W + (isFirstOfRow ? 0 : 0);
      const y = 16 + row * rowH;
      const w = MEASURE_W;

      const stave = new Stave(x, y, w);
      if (isFirstOfRow) {
        stave.addClef(cfg.clef);
        if (mi === 0) {
          stave.addTimeSignature(doc.time_signature);
          if (!cfg.isDrums) stave.addKeySignature(doc.key_signature.replace(/m$/, 'm'));
        }
      }
      stave.setContext(ctx).draw();

      // Piano: segundo pentagrama en clave de fa para la mano izquierda
      let bassStave: Stave | null = null;
      if (cfg.grandStaff) {
        bassStave = new Stave(x, y + 100, w);
        if (isFirstOfRow) {
          bassStave.addClef('bass');
          if (mi === 0) {
            bassStave.addTimeSignature(doc.time_signature);
            bassStave.addKeySignature(doc.key_signature.replace(/m$/, 'm'));
          }
        }
        bassStave.setContext(ctx).draw();
      }

      let tabStave: TabStave | null = null;
      if (cfg.tuning) {
        tabStave = new TabStave(x, y + 96, w, { numLines: cfg.tuning.length });
        if (isFirstOfRow) tabStave.addClef('tab');
        tabStave.setContext(ctx).draw();
      }

      measureHitsRef.current.push({ x, y, w, h: rowH - 20, measure: mi });

      // ---- construir notas
      const source: ScoreMeasure = m.notes.length ? m : { notes: [{ keys: [restKey(cfg.clef)], duration: 'w', rest: true }] };
      const staveNotes: StaveNote[] = [];
      const bassNotes: StaveNote[] = [];
      const tabNotes: TabNote[] = [];

      const addAccidentals = (sn: StaveNote, keys: string[]) => {
        keys.forEach((k, ki) => {
          if (k.includes('#')) sn.addModifier(new Accidental('#'), ki);
          else if (/^[a-g]b/i.test(k)) sn.addModifier(new Accidental('b'), ki);
        });
      };

      source.notes.forEach((n) => {
        const allKeys = n.rest
          ? [restKey(cfg.clef)]
          : cfg.isDrums
            ? (n.drums?.length ? n.drums.map((d) => DRUM_MAP[d].key) : ['c/5'])
            : n.keys;

        // reparto de manos para piano: C4 (midi 60) hacia arriba = mano derecha
        const rightKeys = cfg.grandStaff && !n.rest
          ? allKeys.filter((k) => keyToMidi(k) >= 60)
          : allKeys;
        const leftKeys = cfg.grandStaff && !n.rest
          ? allKeys.filter((k) => keyToMidi(k) < 60)
          : [];

        const trebleIsRest = n.rest || (cfg.grandStaff ? rightKeys.length === 0 : false);
        const sn = new StaveNote({
          keys: trebleIsRest ? [restKey(cfg.clef)] : rightKeys,
          duration: `${n.duration}${trebleIsRest ? 'r' : ''}`,
          clef: cfg.clef === 'percussion' ? 'treble' : cfg.clef,
        });
        if (n.dotted) Dot.buildAndAttach([sn], { all: true });
        if (!trebleIsRest && !cfg.isDrums) addAccidentals(sn, rightKeys);
        if (n.articulation) {
          try {
            sn.addModifier(new Articulation(ARTICULATION_CODE[n.articulation]).setPosition(3), 0);
          } catch { /* articulación no soportada */ }
        }
        if (n.dynamic) {
          const dyn = new Annotation(n.dynamic)
            .setFont('serif', 11, 'bold italic')
            .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
          sn.addModifier(dyn, 0);
        }
        if (n.lyric) {
          const ly = new Annotation(n.lyric)
            .setFont('sans-serif', 10, 'normal')
            .setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
          sn.addModifier(ly, 0);
        }
        staveNotes.push(sn);


        if (bassStave) {
          const leftIsRest = n.rest || leftKeys.length === 0;
          const bn = new StaveNote({
            keys: leftIsRest ? ['d/3'] : leftKeys,
            duration: `${n.duration}${leftIsRest ? 'r' : ''}`,
            clef: 'bass',
          });
          if (n.dotted) Dot.buildAndAttach([bn], { all: true });
          if (!leftIsRest) addAccidentals(bn, leftKeys);
          bassNotes.push(bn);
        }

        if (tabStave) {
          const positions = n.rest
            ? [{ str: 1, fret: '' as unknown as number }]
            : (n.tab?.length
              ? n.tab
              : n.keys.map((k) => {
                const midi = keyToMidi(k);
                const t = cfg.tuning!
                  .map((open, i) => ({ str: i + 1, fret: midi - open }))
                  .filter((p) => p.fret >= 0 && p.fret <= 17)
                  .sort((a, b) => a.fret - b.fret)[0];
                return t ?? { str: 1, fret: 0 };
              }));
          const tn = new TabNote({ positions, duration: toVfDuration(n) });
          tabNotes.push(tn);
        }
      });

      const totalBeats = measureBeats(source) || beatsBar;
      const voice = new Voice({ numBeats: numBeats || 4, beatValue: beatValue || 4 });
      voice.setMode(Voice.Mode.SOFT);
      voice.addTickables(staveNotes);

      const voices: Voice[] = [voice];
      let tabVoice: Voice | null = null;
      if (tabStave && tabNotes.length) {
        tabVoice = new Voice({ numBeats: numBeats || 4, beatValue: beatValue || 4 });
        tabVoice.setMode(Voice.Mode.SOFT);
        tabVoice.addTickables(tabNotes);
        voices.push(tabVoice);
      }
      let bassVoice: Voice | null = null;
      if (bassStave && bassNotes.length) {
        bassVoice = new Voice({ numBeats: numBeats || 4, beatValue: beatValue || 4 });
        bassVoice.setMode(Voice.Mode.SOFT);
        bassVoice.addTickables(bassNotes);
        voices.push(bassVoice);
      }

      const fmt = new Formatter();
      voices.forEach((v) => fmt.joinVoices([v]));
      fmt.format(voices, w - (isFirstOfRow ? 90 : 30));

      const beams = Beam.generateBeams(staveNotes.filter((sn) => !sn.isRest()));
      const bassBeams = bassNotes.length
        ? Beam.generateBeams(bassNotes.filter((bn) => !bn.isRest()))
        : [];

      // resaltar nota seleccionada / en reproducción
      source.notes.forEach((_, ni) => {
        const isPlaying = playing && playing.measure === mi && playing.index === ni;
        const isSelected = !isPlaying && selected && selected.measure === mi && selected.index === ni;
        if (isPlaying || isSelected) {
          const style = { fillStyle: accent, strokeStyle: accent };
          staveNotes[ni]?.setStyle(style);
          tabNotes[ni]?.setStyle(style);
          bassNotes[ni]?.setStyle(style);
        }
      });

      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());
      if (tabVoice && tabStave) tabVoice.draw(ctx, tabStave);
      if (bassVoice && bassStave) {
        bassVoice.draw(ctx, bassStave);
        bassBeams.forEach((b) => b.setContext(ctx).draw());
      }

      // número de compás
      ctx.save();
      ctx.setFillStyle(ink);
      ctx.setFont('sans-serif', 9, 'normal');
      ctx.fillText(String(mi + 1), x + 3, y - 4);
      if (totalBeats !== beatsBar) {
        ctx.setFillStyle('#dc2626');
        ctx.fillText(`${totalBeats}/${beatsBar}`, x + w - 42, y - 4);
      }
      ctx.restore();

      // acordes escritos
      source.notes.forEach((n, ni) => {
        if (!n.chord) return;
        const sn = staveNotes[ni];
        ctx.save();
        ctx.setFillStyle(ink);
        ctx.setFont('sans-serif', 11, 'bold');
        ctx.fillText(n.chord, sn.getAbsoluteX(), y - 6);
        ctx.restore();
      });

      // zonas clicables
      if (m.notes.length) {
        staveNotes.forEach((sn, ni) => {
          const nx = sn.getAbsoluteX();
          hitsRef.current.push({ x: nx - 12, y, w: 26, h: rowH - 26, ref: { measure: mi, index: ni } });
        });
      }

    });

    const svg = host.querySelector('svg');
    if (svg) {
      svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.removeAttribute('width');
      svg.setAttribute('style', 'width:100%;height:auto');
      svgRef?.(svg as SVGSVGElement);
    }
    return () => svgRef?.(null);
  }, [doc, selected, playing, measuresPerRow, svgRef]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const svg = hostRef.current?.querySelector('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scale = vb.width / rect.width;
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;

    const hit = hitsRef.current.find((h) => px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h);
    if (hit) { onSelectNote?.(hit.ref); return; }
    const mh = measureHitsRef.current.find((h) => px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h);
    if (mh) onSelectMeasure?.(mh.measure);
  };

  return (
    <div
      className="w-full overflow-x-auto rounded-xl p-3"
      style={{ background: 'hsl(var(--score-paper))' }}
    >
      <div ref={hostRef} onClick={handleClick} className="cursor-pointer min-w-[560px]" />
    </div>
  );
};
