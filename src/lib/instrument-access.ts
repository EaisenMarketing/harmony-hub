// Single source of truth for the new "one plan per instrument" model.
export type InstrumentSlug =
  | 'piano'
  | 'guitar'
  | 'electric_guitar'
  | 'bass'
  | 'drums'
  | 'trumpet'
  | 'production';

export interface InstrumentPlanInfo {
  id: InstrumentSlug;
  label: string;
  emoji: string;
  price: number; // USD per month
  description: string;
  color: string; // tailwind gradient
}

export const INSTRUMENT_PLANS: InstrumentPlanInfo[] = [
  { id: 'piano',           label: 'Piano',               emoji: '🎹', price: 75, description: 'Acceso completo a cursos, clases en vivo y herramientas de piano.', color: 'from-indigo-500 to-purple-600' },
  { id: 'guitar',          label: 'Guitarra Acústica',   emoji: '🎸', price: 75, description: 'Todo el contenido y herramientas de guitarra acústica.',              color: 'from-amber-500 to-orange-600' },
  { id: 'electric_guitar', label: 'Guitarra Eléctrica',  emoji: '🎸', price: 75, description: 'Cursos, técnica y herramientas de guitarra eléctrica.',              color: 'from-rose-500 to-red-600' },
  { id: 'bass',            label: 'Bajo',                emoji: '🎸', price: 75, description: 'Curso completo de bajo, groove y técnica.',                          color: 'from-emerald-500 to-teal-600' },
  { id: 'drums',           label: 'Batería',             emoji: '🥁', price: 75, description: 'Ritmo, coordinación y clases especializadas de batería.',            color: 'from-sky-500 to-blue-600' },
  { id: 'trumpet',         label: 'Trompeta',            emoji: '🎺', price: 75, description: 'Técnica, embocadura y repertorio de trompeta.',                     color: 'from-yellow-500 to-amber-600' },
  { id: 'production',      label: 'Producción Musical',  emoji: '🎛️', price: 99, description: 'DAWs, mezcla, mastering, samples y clases en vivo de producción.',  color: 'from-violet-600 to-fuchsia-600' },
];

export const INSTRUMENT_PLAN_MAP: Record<InstrumentSlug, InstrumentPlanInfo> =
  Object.fromEntries(INSTRUMENT_PLANS.map((p) => [p.id, p])) as Record<InstrumentSlug, InstrumentPlanInfo>;

export const isValidInstrument = (v: unknown): v is InstrumentSlug =>
  typeof v === 'string' && (INSTRUMENT_PLANS as { id: string }[]).some((p) => p.id === v);

// Maps a course.instrument enum value ("guitar" | "piano" | "drums" | "banjo") to a plan slug.
export const courseInstrumentToPlan = (
  courseInstrument: string | null | undefined,
  requiredPlan?: string | null,
): InstrumentSlug | null => {
  if (requiredPlan === 'production') return 'production';
  if (!courseInstrument) return null;
  if (isValidInstrument(courseInstrument)) return courseInstrument;
  return null;
};

export function hasAccessToCourseInstrument(
  userInstrument: InstrumentSlug | null,
  courseInstrument: string | null | undefined,
  requiredPlan?: string | null,
  isAdmin?: boolean,
): boolean {
  if (isAdmin) return true;
  if (!userInstrument) return false;
  const target = courseInstrumentToPlan(courseInstrument, requiredPlan);
  if (!target) return true; // untagged course → everyone with any plan
  return userInstrument === target;
}

// Which instruments unlock which AI tools.
export const AI_TOOL_INSTRUMENTS: Record<'chord_generator' | 'chord_photo', InstrumentSlug[]> = {
  chord_generator: ['piano', 'guitar', 'electric_guitar', 'bass'],
  chord_photo:     ['guitar', 'electric_guitar', 'bass'],
};
