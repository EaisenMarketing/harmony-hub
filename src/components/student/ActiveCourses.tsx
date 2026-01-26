import { useState, useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { CourseFilters, CourseFiltersState } from './CourseFilters';
import type { CourseWithProgress } from '@/hooks/useStudentData';

interface ActiveCoursesProps {
  courses: CourseWithProgress[];
  isLoading: boolean;
}

export const ActiveCourses = ({ courses, isLoading }: ActiveCoursesProps) => {
  const [filters, setFilters] = useState<CourseFiltersState>({
    instrument: 'all',
    level: 'all',
  });

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesInstrument = filters.instrument === 'all' || course.instrument === filters.instrument;
      const matchesLevel = filters.level === 'all' || course.level === filters.level;
      return matchesInstrument && matchesLevel;
    });
  }, [courses, filters]);

  // Show courses with progress first, then others
  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      if (a.progress > 0 && b.progress === 0) return -1;
      if (a.progress === 0 && b.progress > 0) return 1;
      return b.progress - a.progress;
    });
  }, [filteredCourses]);

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Mis Cursos</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Mis Cursos</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredCourses.length} de {courses.length})
          </span>
        </div>
        <CourseFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {sortedCourses.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          {courses.length === 0 ? (
            <>
              <h3 className="font-medium text-foreground">No tienes cursos activos</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Explora nuestro catálogo y comienza a aprender hoy
              </p>
            </>
          ) : (
            <>
              <h3 className="font-medium text-foreground">No hay cursos con estos filtros</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Prueba cambiando los filtros para ver más cursos
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
};
