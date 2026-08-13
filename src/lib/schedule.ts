// Horarios: la escuela opera en Estados Unidos (hora del Este / ET).
// Toda clase se guarda en UTC y se muestra convertida a la zona del alumno,
// con la hora oficial de EE. UU. como referencia.

export const SCHOOL_TIMEZONE = 'America/New_York';
export const SCHOOL_TIMEZONE_LABEL = 'ET (EE. UU.)';

/** Zonas horarias soportadas: EE. UU. primero, luego México y Latinoamérica. */
export const TIMEZONES = [
  { value: 'America/New_York', label: 'Nueva York / Miami — Este (ET)' },
  { value: 'America/Chicago', label: 'Chicago / Houston — Central (CT)' },
  { value: 'America/Denver', label: 'Denver / Phoenix — Montaña (MT)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles — Pacífico (PT)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'America/Monterrey', label: 'Monterrey' },
  { value: 'America/Tijuana', label: 'Tijuana' },
  { value: 'America/Guatemala', label: 'Guatemala / San Salvador' },
  { value: 'America/Bogota', label: 'Bogotá / Lima / Quito' },
  { value: 'America/Santo_Domingo', label: 'Santo Domingo / San Juan' },
  { value: 'America/Santiago', label: 'Santiago de Chile' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires / Montevideo' },
  { value: 'Europe/Madrid', label: 'Madrid' },
] as const;

/** Zona horaria detectada del navegador del alumno. */
export function userTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || SCHOOL_TIMEZONE;
  } catch {
    return SCHOOL_TIMEZONE;
  }
}

/** Abreviatura de la zona (p. ej. "CST", "GMT-6"). */
export function timeZoneAbbr(date: Date | string, timeZone = userTimeZone()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    const parts = new Intl.DateTimeFormat('es-MX', { timeZone, timeZoneName: 'short' }).formatToParts(d);
    return parts.find(p => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

/** Hora local del alumno, p. ej. "7:00 PM CST". */
export function formatLocalTime(date: Date | string, timeZone = userTimeZone()): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const time = new Intl.DateTimeFormat('es-MX', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  const abbr = timeZoneAbbr(d, timeZone);
  return abbr ? `${time} ${abbr}` : time;
}

/** Hora oficial de la escuela (EE. UU. / ET). */
export function formatSchoolTime(date: Date | string): string {
  return formatLocalTime(date, SCHOOL_TIMEZONE);
}

/** Fecha larga en la zona del alumno. */
export function formatLocalDate(
  date: Date | string,
  timeZone = userTimeZone(),
  options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' },
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', { timeZone, ...options }).format(d);
}

/** "vie 15 ago · 7:00 PM CST (6:00 PM EDT)" */
export function formatClassSchedule(date: Date | string): string {
  const local = `${formatLocalDate(date)} · ${formatLocalTime(date)}`;
  const school = formatSchoolTime(date);
  const isSchoolZone = userTimeZone() === SCHOOL_TIMEZONE;
  return isSchoolZone ? local : `${local} (${school} ET)`;
}
