// Planes de suscripción B2B para maestros (independientes de los planes de alumno).
export type TeacherPlanId = 'starter' | 'pro' | 'academy';

export interface TeacherPlanInfo {
  id: TeacherPlanId;
  label: string;
  price: number; // USD / mes
  seats: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const TEACHER_PLANS: TeacherPlanInfo[] = [
  {
    id: 'starter',
    label: 'Starter',
    price: 39,
    seats: 10,
    tagline: 'Para maestros que empiezan a digitalizar sus clases.',
    features: [
      'Hasta 10 alumnos activos',
      'Tus propios cursos y lecciones ilimitadas',
      'Enlace de invitación para tus alumnos',
      'Herramientas de IA y práctica de Acorde Live',
      'Tareas y seguimiento de avance',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 89,
    seats: 40,
    tagline: 'El favorito de maestros con agenda llena.',
    features: [
      'Hasta 40 alumnos activos',
      'Todo lo del plan Starter',
      'Panel de avance por alumno',
      'Tareas con fecha límite y estado',
      'Soporte prioritario',
    ],
    highlight: true,
  },
  {
    id: 'academy',
    label: 'Academia',
    price: 199,
    seats: 250,
    tagline: 'Para escuelas y estudios con varios grupos.',
    features: [
      'Hasta 250 alumnos activos',
      'Todo lo del plan Pro',
      'Cursos organizados por nivel y grupo',
      'Exportación de alumnos y avance',
      'Acompañamiento en la puesta en marcha',
    ],
  },
];

export const TEACHER_PLAN_MAP: Record<TeacherPlanId, TeacherPlanInfo> =
  Object.fromEntries(TEACHER_PLANS.map((p) => [p.id, p])) as Record<TeacherPlanId, TeacherPlanInfo>;

export const TEACHER_STATUS_LABEL: Record<string, string> = {
  trial: 'Prueba',
  active: 'Activo',
  suspended: 'Suspendido',
  canceled: 'Cancelado',
};

export const TEACHER_STUDENT_STATUS_LABEL: Record<string, string> = {
  invited: 'Invitado',
  active: 'Activo',
  inactive: 'Inactivo',
};

export const studioInviteUrl = (code: string) =>
  `${window.location.origin}/invitacion/${code}`;
