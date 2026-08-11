// Acorde Live — modelo de membresía.
// PLAN = beneficios. INSTRUMENTO = qué puede estudiar. TRIAL = aún sin cobro.
// Regla inquebrantable: todos los planes permiten 1 (UN) instrumento activo.

export type PlanKeyNew = 'essential' | 'pro' | 'premium';

export const MAX_ACTIVE_INSTRUMENTS_PER_USER = 1;
export const TRIAL_DAYS = 3;
export const DEFAULT_TRIAL_SLOTS_PER_GROUP = 3;
export const INSTRUMENT_CHANGE_COOLDOWN_DAYS = 30;

export interface MembershipPlan {
  key: PlanKeyNew;
  name: string;
  priceUsd: number;
  tagline: string;
  popular?: boolean;
  aiToolLimit: number | null; // null = todas
  features: string[];
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    key: 'essential',
    name: 'Esencial',
    priceUsd: 29.99,
    tagline: 'Empieza con lo indispensable.',
    aiToolLimit: 1,
    features: [
      '1 instrumento',
      '1 clase grupal en vivo semanal',
      'Contenido del instrumento seleccionado',
      'Material educativo',
      '1 herramienta de Acorde AI',
      'Seguimiento básico del progreso',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    priceUsd: 49.99,
    tagline: 'El equilibrio perfecto para avanzar rápido.',
    popular: true,
    aiToolLimit: 3,
    features: [
      '1 instrumento',
      '1 clase grupal en vivo semanal',
      'Contenido del instrumento seleccionado',
      'Material educativo',
      'Hasta 3 herramientas de Acorde AI',
      'Envío de prácticas',
      'Retroalimentación del maestro',
      'Contenido avanzado',
      'Seguimiento avanzado del progreso',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    priceUsd: 69.99,
    tagline: 'Todo el poder de Acorde AI en tu instrumento.',
    aiToolLimit: null,
    features: [
      '1 instrumento',
      '1 clase grupal en vivo semanal',
      'Acceso al contenido de ese instrumento',
      'Material educativo',
      'Todas las herramientas de Acorde AI',
      'Envío de prácticas',
      'Retroalimentación prioritaria',
      'Contenido avanzado',
      'Seguimiento premium del progreso',
    ],
  },
];

export const MEMBERSHIP_PLAN_MAP: Record<PlanKeyNew, MembershipPlan> =
  Object.fromEntries(MEMBERSHIP_PLANS.map((p) => [p.key, p])) as Record<PlanKeyNew, MembershipPlan>;

export const isMembershipPlan = (v: unknown): v is PlanKeyNew =>
  v === 'essential' || v === 'pro' || v === 'premium';

export const PLAN_LABEL = (key?: string | null) =>
  isMembershipPlan(key) ? MEMBERSHIP_PLAN_MAP[key].name : 'Sin plan';

// Herramienta incluida durante la prueba gratuita y en el plan Esencial.
export const TRIAL_AI_TOOL = 'theory_assistant';

// Complemento independiente: clases privadas (no incluidas en ningún plan).
export const PRIVATE_LESSON_OPTIONS = [
  { type: 'single' as const, label: '1 clase privada', sessions: 1, priceUsd: 39, duration: '45–50 min' },
  { type: 'pack4' as const, label: 'Paquete de 4 clases', sessions: 4, priceUsd: 139, duration: '45–50 min cada una' },
];

export const LEVELS = [
  { key: 'never_played', name: 'Nunca he tocado este instrumento' },
  { key: 'beginner', name: 'Principiante' },
  { key: 'intermediate', name: 'Intermedio' },
  { key: 'advanced', name: 'Avanzado' },
  { key: 'unsure', name: 'No estoy seguro' },
];

export const LEVEL_LABEL = (key?: string | null) =>
  LEVELS.find((l) => l.key === key)?.name ?? '—';

export const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/** Formatea una fecha UTC en la zona horaria del alumno. */
export const formatInTimezone = (iso: string | Date, timezone?: string | null) => {
  const tz = timezone || browserTimezone();
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: 'numeric', minute: '2-digit', timeZone: tz, timeZoneName: 'short',
  }).format(d);
};

/** Próxima ocurrencia semanal de un grupo (weekday + hora UTC) en la zona del alumno. */
export const nextGroupOccurrence = (weekday: number, startTimeUtc: string) => {
  const [h, m] = startTimeUtc.split(':').map(Number);
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m || 0, 0));
  const diff = (weekday - d.getUTCDay() + 7) % 7;
  d.setUTCDate(d.getUTCDate() + diff);
  if (d.getTime() < now.getTime()) d.setUTCDate(d.getUTCDate() + 7);
  return d;
};

export const formatMoney = (usd: number) =>
  `$${usd.toFixed(2)} USD`;

export const trialEndCopy = (planKey: PlanKeyNew, endsAt?: string | Date | null) => {
  const plan = MEMBERSHIP_PLAN_MAP[planKey];
  if (!endsAt) return `Tu plan ${plan.name} comenzará después de la prueba por ${formatMoney(plan.priceUsd)}/mes.`;
  const d = typeof endsAt === 'string' ? new Date(endsAt) : endsAt;
  const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long' }).format(d);
  return `Tu plan ${plan.name} comenzará el ${date} por ${formatMoney(plan.priceUsd)}/mes.`;
};

export const TRIAL_DISCLAIMER =
  '$0 hoy. Tu membresía comenzará automáticamente después de 3 días. Puedes cancelar antes de que termine la prueba y no se realizará ningún cobro.';
