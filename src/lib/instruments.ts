// Fuente única de verdad de instrumentos de Acorde Live.
// Los `id` son los valores que se guardan en la columna courses.instrument y
// live_classes.instrument (texto libre).
export const INSTRUMENTS = [
  { id: 'guitar',           label: 'Guitarra acústica',  emoji: '🎸', slug: 'guitarra-acustica' },
  { id: 'electric_guitar',  label: 'Guitarra eléctrica', emoji: '🎸', slug: 'guitarra-electrica' },
  { id: 'bass',             label: 'Bajo',               emoji: '🎸', slug: 'bajo' },
  { id: 'drums',            label: 'Batería',            emoji: '🥁', slug: 'bateria' },
  { id: 'piano',            label: 'Piano',              emoji: '🎹', slug: 'piano' },
  { id: 'trumpet',          label: 'Trompeta',           emoji: '🎺', slug: 'trompeta' },
  { id: 'production',       label: 'Producción Musical', emoji: '🎛️', slug: 'produccion-musical' },
] as const;

export type InstrumentId = typeof INSTRUMENTS[number]['id'];

// Instrumentos ofrecidos públicamente hoy (Producción Musical está pausada,
// solo sigue disponible dentro del dashboard para cuentas existentes).
export const PUBLIC_INSTRUMENTS = INSTRUMENTS.filter(i => i.id !== 'production');

export const INSTRUMENT_LABEL: Record<string, string> = Object.fromEntries(
  INSTRUMENTS.map(i => [i.id, i.label])
);

export const INSTRUMENT_EMOJI: Record<string, string> = Object.fromEntries(
  INSTRUMENTS.map(i => [i.id, i.emoji])
);

export function instrumentLabel(id: string | null | undefined): string {
  if (!id) return '';
  return INSTRUMENT_LABEL[id] ?? id;
}
