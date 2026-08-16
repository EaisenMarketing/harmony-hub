import { useCallback, useEffect, useRef, useState } from 'react';
import { freqToMidi, keyLabel, midiToKey } from '@/lib/score/model';

/** Autocorrelación simple para detectar el tono fundamental. */
function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  const size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.012) return null;

  let r1 = 0;
  let r2 = size - 1;
  const thres = 0.2;
  for (let i = 0; i < size / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (let i = 1; i < size / 2; i++) if (Math.abs(buf[size - i]) < thres) { r2 = size - i; break; }

  const trimmed = buf.slice(r1, r2);
  const n = trimmed.length;
  const c = new Float32Array(n).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) c[i] += trimmed[j] * trimmed[j + i];

  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < n; i++) if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
  if (maxPos <= 0) return null;

  const y1 = c[maxPos - 1];
  const y2 = c[maxPos];
  const y3 = c[maxPos + 1] ?? 0;
  const a = (y1 + y3 - 2 * y2) / 2;
  const b = (y3 - y1) / 2;
  const period = a ? maxPos - b / (2 * a) : maxPos;
  const freq = sampleRate / period;
  return freq > 55 && freq < 2000 ? freq : null;
}

/**
 * Entrada cantando o tocando: escucha el micrófono y entrega la nota estable detectada.
 */
export const usePitchInput = (onNote: (key: string) => void) => {
  const [listening, setListening] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>();
  const stableRef = useRef<{ midi: number; count: number }>({ midi: 0, count: 0 });
  const lastEmitRef = useRef(0);
  const cbRef = useRef(onNote);
  cbRef.current = onNote;

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => undefined);
    streamRef.current = null;
    ctxRef.current = null;
    setListening(false);
    setCurrent(null);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      setListening(true);
      setError(null);

      const loop = () => {
        analyser.getFloatTimeDomainData(buf);
        const freq = detectPitch(buf, ctx.sampleRate);
        if (freq) {
          const midi = Math.round(freqToMidi(freq));
          setCurrent(keyLabel(midiToKey(midi)));
          if (stableRef.current.midi === midi) stableRef.current.count += 1;
          else stableRef.current = { midi, count: 1 };
          const now = performance.now();
          if (stableRef.current.count === 5 && now - lastEmitRef.current > 260) {
            lastEmitRef.current = now;
            cbRef.current(midiToKey(midi));
          }
        } else {
          stableRef.current = { midi: 0, count: 0 };
          setCurrent(null);
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setError('No pudimos usar tu micrófono. Revisa los permisos del navegador.');
    }
  }, []);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => undefined);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return { listening, current, error, start, stop };
};
