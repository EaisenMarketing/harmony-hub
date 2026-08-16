import { useCallback, useEffect, useRef, useState } from 'react';
import { midiToKey } from '@/lib/score/model';

type MidiAccessLike = {
  inputs: Map<string, { name?: string | null; onmidimessage: ((e: { data: Uint8Array }) => void) | null }>;
  onstatechange: (() => void) | null;
};

/**
 * Entrada por teclado/controlador MIDI (Web MIDI API).
 * Llama a `onNote` con la clave VexFlow cada vez que se toca una nota.
 */
export const useMidiInput = (onNote: (key: string, velocity: number) => void) => {
  const [enabled, setEnabled] = useState(false);
  const [devices, setDevices] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const accessRef = useRef<MidiAccessLike | null>(null);
  const cbRef = useRef(onNote);
  cbRef.current = onNote;

  const supported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;

  const bind = useCallback((access: MidiAccessLike) => {
    const names: string[] = [];
    access.inputs.forEach((input) => {
      names.push(input.name || 'MIDI');
      input.onmidimessage = (e) => {
        const [status, note, vel] = e.data;
        if ((status & 0xf0) === 0x90 && vel > 0) cbRef.current(midiToKey(note), vel / 127);
      };
    });
    setDevices(names);
  }, []);

  const enable = useCallback(async () => {
    if (!supported) { setError('Tu navegador no soporta MIDI (usa Chrome o Edge).'); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const access = (await (navigator as any).requestMIDIAccess({ sysex: false })) as MidiAccessLike;
      accessRef.current = access;
      bind(access);
      access.onstatechange = () => bind(access);
      setEnabled(true);
      setError(null);
    } catch {
      setError('No se pudo acceder a tus dispositivos MIDI.');
    }
  }, [supported, bind]);

  const disable = useCallback(() => {
    accessRef.current?.inputs.forEach((i) => { i.onmidimessage = null; });
    if (accessRef.current) accessRef.current.onstatechange = null;
    accessRef.current = null;
    setEnabled(false);
    setDevices([]);
  }, []);

  useEffect(() => () => {
    accessRef.current?.inputs.forEach((i) => { i.onmidimessage = null; });
  }, []);

  return { supported, enabled, devices, error, enable, disable };
};
