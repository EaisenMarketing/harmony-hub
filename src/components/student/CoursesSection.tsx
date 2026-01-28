import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Clock, Award, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStudentCourses, useAvailableCourses } from '@/hooks/useStudentData';

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
  banjo: 'Banjo',
};

const levelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const CoursesSection = () => {
  const navigate = useNavigate();
  const { data: enrolledCourses = [], isLoading: loadingEnrolled } = useStudentCourses();
  const { data: availableCourses = [], isLoading: loadingAvailable } = useAvailableCourses();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filterCourses = <T extends { title: string; description?: string | null; instrument: string; level: string }>(courses: T[]) => {
    return courses.filter((course) => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesInstrument = instrumentFilter === 'all' || course.instrument === instrumentFilter;
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      return matchesSearch && matchesInstrument && matchesLevel;
    });
  };

  const filteredEnrolled = filterCourses(enrolledCourses);
  const filteredAvailable = filterCourses(
    availableCourses.filter((c) => !enrolledCourses.some((e) => e.id === c.id))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mis Cursos</h1>
        <p className="text-muted-foreground mt-1">
          Explora y continúa tu aprendizaje musical
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={instrumentFilter} onValueChange={setInstrumentFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Instrumento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="guitar">Guitarra</SelectItem>
            <SelectItem value="piano">Piano</SelectItem>
            <SelectItem value="drums">Batería</SelectItem>
            <SelectItem value="banjo">Banjo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Nivel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="beginner">Principiante</SelectItem>
            <SelectItem value="intermediate">Intermedio</SelectItem>
            <SelectItem value="advanced">Avanzado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="enrolled" className="space-y-6">
        <TabsList>
          <TabsTrigger value="enrolled">
            En Progreso ({filteredEnrolled.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Disponibles ({filteredAvailable.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="space-y-4">
          {loadingEnrolled ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-muted" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEnrolled.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No tienes cursos en progreso
              </h3>
              <p className="text-muted-foreground mb-4">
                Explora los cursos disponibles y comienza a aprender
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(filteredEnrolled as typeof enrolledCourses).map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/portal/curso/${course.id}`)}
                >
                  <div className="relative h-40 bg-muted">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <Progress value={course.progress || 0} className="h-2" />
                      <span className="text-xs text-white mt-1 block">
                        {course.progress || 0}% completado
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {instrumentLabels[course.instrument] || course.instrument}
                      </Badge>
                      <Badge variant="outline">
                        {levelLabels[course.level] || course.level}
                      </Badge>
                    </div>
                    <Button className="w-full mt-4" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Continuar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {loadingAvailable ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-muted" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay más cursos disponibles
              </h3>
              <p className="text-muted-foreground">
                Ya estás inscrito en todos los cursos
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAvailable.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/portal/curso/${course.id}`)}
                >
                  <div className="relative h-40 bg-muted">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {course.required_plan !== 'basic' && (
                      <Badge className="absolute top-3 right-3" variant="secondary">
                        {course.required_plan === 'pro' ? 'Pro' : 'Estándar'}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge variant="secondary">
                        {instrumentLabels[course.instrument] || course.instrument}
                      </Badge>
                      <Badge variant="outline">
                        {levelLabels[course.level] || course.level}
                      </Badge>
                      {course.duration_hours && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration_hours}h
                        </span>
                      )}
                    </div>
                    <Button className="w-full" size="sm" variant="outline">
                      Ver Curso
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
