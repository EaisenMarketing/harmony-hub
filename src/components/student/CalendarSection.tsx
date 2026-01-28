import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Video, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUpcomingClasses, useUserRegistrations } from '@/hooks/useStudentData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
  banjo: 'Banjo',
};

export const CalendarSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: classes = [], isLoading } = useUpcomingClasses();
  const { data: registrations = [] } = useUserRegistrations();

  const registeredClassIds = registrations.map((r) => r.live_class_id);

  const registerForClass = useMutation({
    mutationFn: async (classId: string) => {
      if (!user?.id) throw new Error('No user');
      const { error } = await supabase
        .from('live_class_registrations')
        .insert({ user_id: user.id, live_class_id: classId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-registrations'] });
      toast({ title: '¡Inscripción exitosa!', description: 'Te has registrado en la clase.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo completar la inscripción.', variant: 'destructive' });
    },
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const classesOnDate = (date: Date) =>
    classes.filter((c) => isSameDay(new Date(c.scheduled_at), date));

  const selectedClasses = selectedDate ? classesOnDate(selectedDate) : [];

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus clases en vivo y próximos eventos
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dayClasses = classesOnDate(day);
                const hasClasses = dayClasses.length > 0;
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'aspect-square p-1 rounded-lg text-sm transition-colors relative',
                      isToday(day) && 'bg-primary/10 font-bold text-primary',
                      isSelected && 'bg-primary text-primary-foreground',
                      !isSelected && !isToday(day) && 'hover:bg-muted',
                      hasClasses && !isSelected && 'font-medium'
                    )}
                  >
                    {format(day, 'd')}
                    {hasClasses && (
                      <span
                        className={cn(
                          'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                          isSelected ? 'bg-primary-foreground' : 'bg-primary'
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: es })
                : 'Selecciona un día'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Selecciona un día en el calendario para ver las clases
              </p>
            ) : selectedClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay clases programadas para este día
              </p>
            ) : (
              selectedClasses.map((liveClass) => {
                const isRegistered = registeredClassIds.includes(liveClass.id);
                return (
                  <div
                    key={liveClass.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-foreground">{liveClass.title}</h4>
                      {isRegistered && (
                        <Badge variant="secondary" className="shrink-0">
                          Inscrito
                        </Badge>
                      )}
                    </div>
                    {liveClass.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {liveClass.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(liveClass.scheduled_at), 'HH:mm')}
                      </span>
                      {liveClass.duration_minutes && (
                        <span>• {liveClass.duration_minutes} min</span>
                      )}
                      {liveClass.instrument && (
                        <Badge variant="outline" className="text-xs">
                          {instrumentLabels[liveClass.instrument] || liveClass.instrument}
                        </Badge>
                      )}
                      {liveClass.max_attendees && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Máx {liveClass.max_attendees}
                        </span>
                      )}
                    </div>
                    {isRegistered ? (
                      liveClass.zoom_join_url && (
                        <Button size="sm" className="w-full" asChild>
                          <a href={liveClass.zoom_join_url} target="_blank" rel="noopener noreferrer">
                            <Video className="w-4 h-4 mr-2" />
                            Unirse a la Clase
                          </a>
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => registerForClass.mutate(liveClass.id)}
                        disabled={registerForClass.isPending}
                      >
                        Inscribirme
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Classes List */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Clases en Vivo</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay clases programadas próximamente
            </p>
          ) : (
            <div className="space-y-4">
              {classes.slice(0, 5).map((liveClass) => {
                const isRegistered = registeredClassIds.includes(liveClass.id);
                return (
                  <div
                    key={liveClass.id}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary shrink-0">
                      <span className="text-lg font-bold">
                        {format(new Date(liveClass.scheduled_at), 'd')}
                      </span>
                      <span className="text-xs uppercase">
                        {format(new Date(liveClass.scheduled_at), 'MMM', { locale: es })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {liveClass.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(liveClass.scheduled_at), "HH:mm 'hrs'")}
                        {liveClass.duration_minutes && ` • ${liveClass.duration_minutes} min`}
                      </p>
                    </div>
                    {isRegistered ? (
                      <Badge variant="secondary">Inscrito</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => registerForClass.mutate(liveClass.id)}
                        disabled={registerForClass.isPending}
                      >
                        Inscribirme
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
