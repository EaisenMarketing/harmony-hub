import { Midi } from '@tonejs/midi';
import jsPDF from 'jspdf';
import {
  DRUM_MAP, SCORE_INSTRUMENTS, keyToMidi, noteBeats,
  type ScoreDoc,
} from './model';

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const safeName = (t: string) => (t || 'partitura').replace(/[^\w\-áéíóúñ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase();

// ------------------------------------------------------------------- MIDI

export function exportMidi(doc: ScoreDoc) {
  const midi = new Midi();
  midi.header.setTempo(doc.tempo);
  const track = midi.addTrack();
  track.name = doc.title;
  if (SCORE_INSTRUMENTS[doc.instrument].isDrums) track.channel = 9;

  const spb = 60 / Math.max(20, doc.tempo);
  let t = 0;
  doc.content.measures.forEach((m) => {
    m.notes.forEach((n) => {
      const dur = noteBeats(n) * spb;
      if (!n.rest) {
        const notes = SCORE_INSTRUMENTS[doc.instrument].isDrums
          ? (n.drums ?? []).map((d) => DRUM_MAP[d].midi)
          : n.keys.map(keyToMidi);
        notes.forEach((mi) => track.addNote({ midi: mi, time: t, duration: Math.max(0.08, dur * 0.95), velocity: 0.85 }));
      }
      t += dur;
    });
  });

  download(new Blob([midi.toArray().slice().buffer as ArrayBuffer], { type: 'audio/midi' }), `${safeName(doc.title)}.mid`);
}

// --------------------------------------------------------------- MusicXML

const XML_DUR: Record<string, { type: string; divisions: number }> = {
  w: { type: 'whole', divisions: 16 },
  h: { type: 'half', divisions: 8 },
  q: { type: 'quarter', divisions: 4 },
  '8': { type: 'eighth', divisions: 2 },
  '16': { type: '16th', divisions: 1 },
};

export function exportMusicXml(doc: ScoreDoc) {
  const cfg = SCORE_INSTRUMENTS[doc.instrument];
  const [beats, beatType] = doc.time_signature.split('/');
  const clefMap = { treble: ['G', 2], bass: ['F', 4], percussion: ['percussion', 2] } as const;
  const [sign, line] = clefMap[cfg.clef];

  const measures = doc.content.measures.map((m, i) => {
    const notes = m.notes.map((n) => {
      const d = XML_DUR[n.duration];
      const dur = n.dotted ? Math.round(d.divisions * 1.5) : d.divisions;
      const dot = n.dotted ? '<dot/>' : '';
      if (n.rest) return `      <note><rest/><duration>${dur}</duration><type>${d.type}</type>${dot}</note>`;
      const keys = cfg.isDrums
        ? (n.drums ?? []).map((p) => DRUM_MAP[p].key)
        : n.keys;
      return keys.map((k, ki) => {
        const [rawStep, oct] = k.split('/');
        const step = rawStep[0].toUpperCase();
        const alter = rawStep.includes('#') ? '<alter>1</alter>' : rawStep.includes('b') && rawStep.length > 1 ? '<alter>-1</alter>' : '';
        return `      <note>${ki > 0 ? '<chord/>' : ''}<pitch><step>${step}</step>${alter}<octave>${oct}</octave></pitch><duration>${dur}</duration><type>${d.type}</type>${dot}</note>`;
      }).join('\n');
    }).join('\n');

    const attrs = i === 0
      ? `      <attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>${sign}</sign><line>${line}</line></clef></attributes>\n`
      : '';
    return `    <measure number="${i + 1}">\n${attrs}${notes}\n    </measure>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${doc.title}</work-title></work>
  <identification><encoding><software>Acorde Live</software></encoding></identification>
  <part-list><score-part id="P1"><part-name>${cfg.label}</part-name></score-part></part-list>
  <part id="P1">
${measures}
  </part>
</score-partwise>`;

  download(new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' }), `${safeName(doc.title)}.musicxml`);
}

// -------------------------------------------------------------- PNG / PDF

async function svgToPng(svg: SVGSVGElement, scale = 2): Promise<{ dataUrl: string; width: number; height: number }> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const width = Math.ceil(rect.width || svg.viewBox.baseVal.width || 900);
  const height = Math.ceil(rect.height || svg.viewBox.baseVal.height || 400);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const source = new XMLSerializer().serializeToString(clone);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('svg'));
    img.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL('image/png'), width, height };
}

export async function exportPng(svg: SVGSVGElement, doc: ScoreDoc) {
  const { dataUrl } = await svgToPng(svg, 2);
  const bin = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  download(new Blob([bytes.buffer as ArrayBuffer], { type: 'image/png' }), `${safeName(doc.title)}.png`);
}

export async function exportPdf(svg: SVGSVGElement, doc: ScoreDoc) {
  const { dataUrl, width, height } = await svgToPng(svg, 2);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter', compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 40;
  const maxW = pageW - margin * 2;
  const ratio = height / width;

  pdf.setFontSize(18);
  pdf.text(doc.title, margin, 50);
  pdf.setFontSize(10);
  pdf.setTextColor(110);
  pdf.text(
    `${SCORE_INSTRUMENTS[doc.instrument].label} · ${doc.key_signature} · ${doc.time_signature} · ${doc.tempo} BPM${doc.level ? ` · ${doc.level}` : ''}`,
    margin, 68,
  );
  pdf.setTextColor(0);
  pdf.addImage(dataUrl, 'PNG', margin, 86, maxW, maxW * ratio, undefined, 'FAST');
  if (doc.description) {
    pdf.setFontSize(10);
    pdf.text(pdf.splitTextToSize(doc.description, maxW), margin, 86 + maxW * ratio + 26);
  }
  pdf.setFontSize(8);
  pdf.setTextColor(140);
  pdf.text('Creado con Acorde Live', margin, pdf.internal.pageSize.getHeight() - 24);
  pdf.save(`${safeName(doc.title)}.pdf`);
}
