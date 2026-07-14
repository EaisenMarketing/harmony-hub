import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserInstrument } from '@/hooks/useUserInstrument';

export interface ContinueLesson {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  lastWatchedAt: string | null;
  completed: boolean;
}

/**
 * Returns the last lesson the user was watching (matching their instrument).
 * Prefers the most recent NOT-completed lesson; falls back to the most recent overall.
 */
export const useContinueWatching = () => {
  const { user } = useAuth();
  const { data: userIns } = useUserInstrument();
  const primary = userIns?.instrument ?? null;

  return useQuery<ContinueLesson | null>({
    queryKey: ['continue-watching', user?.id, primary],
    queryFn: async () => {
      if (!user?.id || !primary) return null;
      const { data, error } = await supabase
        .from('user_progress')
        .select(
          'lesson_id, progress_percent, completed, last_watched_at, lessons(id, title, course_modules(course_id, courses(id, title, instrument, required_plan)))'
        )
        .eq('user_id', user.id)
        .not('last_watched_at', 'is', null)
        .order('last_watched_at', { ascending: false })
        .limit(25);
      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (data || []) as any[];

      const matches = rows
        .map((r) => {
          const course = r.lessons?.course_modules?.courses;
          if (!course) return null;
          const belongs =
            primary === 'production'
              ? course.required_plan === 'production'
              : course.instrument === primary;
          if (!belongs) return null;
          return {
            lessonId: r.lesson_id as string,
            lessonTitle: (r.lessons?.title as string) || 'Lección',
            courseId: course.id as string,
            courseTitle: course.title as string,
            progressPercent: (r.progress_percent as number) ?? 0,
            lastWatchedAt: r.last_watched_at as string | null,
            completed: !!r.completed,
          } satisfies ContinueLesson;
        })
        .filter((x): x is ContinueLesson => x !== null);

      const inProgress = matches.find((m) => !m.completed);
      return inProgress ?? matches[0] ?? null;
    },
    enabled: !!user?.id && !!primary,
    staleTime: 30_000,
  });
};

export interface WeeklyStat {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Lun"
  lessons: number;
  minutes: number;
}

export interface StudyAnalytics {
  weekly: WeeklyStat[];
  totalMinutesWeek: number;
  lessonsWeek: number;
  streakDays: number;
  weekPercentDelta: number; // vs previous 7 days
}

const MIN_PER_LESSON = 15;
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const useStudyAnalytics = () => {
  const { user } = useAuth();

  return useQuery<StudyAnalytics>({
    queryKey: ['study-analytics', user?.id],
    queryFn: async () => {
      const empty: StudyAnalytics = {
        weekly: [],
        totalMinutesWeek: 0,
        lessonsWeek: 0,
        streakDays: 0,
        weekPercentDelta: 0,
      };
      if (!user?.id) return empty;

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id, last_watched_at, progress_percent, completed')
        .eq('user_id', user.id)
        .gte('last_watched_at', since.toISOString());
      if (error) throw error;

      const rows = (data || []) as Array<{
        lesson_id: string;
        last_watched_at: string | null;
        progress_percent: number | null;
        completed: boolean | null;
      }>;

      const byDay = new Map<string, { lessons: Set<string>; sessions: number }>();
      for (const r of rows) {
        if (!r.last_watched_at) continue;
        const d = new Date(r.last_watched_at);
        const key = d.toISOString().slice(0, 10);
        if (!byDay.has(key)) byDay.set(key, { lessons: new Set(), sessions: 0 });
        const bucket = byDay.get(key)!;
        bucket.lessons.add(r.lesson_id);
        bucket.sessions += 1;
      }

      // Last 7 days (oldest -> newest)
      const weekly: WeeklyStat[] = [];
      let totalMinutesWeek = 0;
      let lessonsWeek = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const b = byDay.get(key);
        const lessons = b ? b.lessons.size : 0;
        const minutes = lessons * MIN_PER_LESSON;
        totalMinutesWeek += minutes;
        lessonsWeek += lessons;
        weekly.push({
          date: key,
          label: DAY_LABELS[d.getDay()],
          lessons,
          minutes,
        });
      }

      // Previous 7 days for delta
      let prevMinutes = 0;
      for (let i = 13; i >= 7; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const b = byDay.get(key);
        prevMinutes += (b ? b.lessons.size : 0) * MIN_PER_LESSON;
      }
      const weekPercentDelta =
        prevMinutes === 0
          ? totalMinutesWeek > 0
            ? 100
            : 0
          : Math.round(((totalMinutesWeek - prevMinutes) / prevMinutes) * 100);

      // Streak: consecutive days up to today with at least 1 lesson
      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (byDay.get(key)?.lessons.size) streak++;
        else if (i > 0) break; // allow "today" empty without breaking streak? no: break
        else break;
      }

      return {
        weekly,
        totalMinutesWeek,
        lessonsWeek,
        streakDays: streak,
        weekPercentDelta,
      };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
};
