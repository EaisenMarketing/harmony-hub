// Centralized plan access control
// Plan hierarchy: basic < standard < pro < production

export type PlanKey = 'basic' | 'standard' | 'pro' | 'production';

export const PLAN_HIERARCHY: Record<PlanKey, number> = {
  basic: 0,
  standard: 1,
  pro: 2,
  production: 3,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  basic: 'Básico',
  standard: 'Estándar',
  pro: 'Pro',
  production: 'Producción Musical',
};

export const PLAN_PRICES: Record<PlanKey, string> = {
  basic: '$0',
  standard: '$45',
  pro: '$75',
  production: '$99',
};

/**
 * Check if a user's plan meets or exceeds the required plan level.
 */
export function hasAccessToFeature(userPlan: string, requiredPlan: PlanKey): boolean {
  const userLevel = PLAN_HIERARCHY[userPlan as PlanKey] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan];
  return userLevel >= requiredLevel;
}

/**
 * Feature access map per plan tier.
 */
export const FEATURE_ACCESS = {
  aiTools: 'standard' as PlanKey,         // Chord generator, theory assistant
  songAnalyzer: 'standard' as PlanKey,    // Song analyzer
  songLibrary: 'standard' as PlanKey,     // Saved songs library
  liveClasses: 'standard' as PlanKey,     // Group live classes
  certificates: 'pro' as PlanKey,         // Official certificates
  allInstruments: 'pro' as PlanKey,       // Access to all instruments (standard = 1 only)
  oneOnOneFeedback: 'pro' as PlanKey,     // 1:1 monthly feedback
  productionClasses: 'production' as PlanKey, // Production music classes
};

/**
 * For basic plan: limit to first N free lessons
 */
export const BASIC_FREE_LESSONS = 3;
