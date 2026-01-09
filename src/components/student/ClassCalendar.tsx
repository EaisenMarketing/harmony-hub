import { useState } from 'react';
import { Calendar, Video, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UpcomingClass } from '@/hooks/useStudentData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ClassCalendarProps {
  classes: UpcomingClass[];
  isLoading: boolean;
}

const instrumentEmojis: Record<string, string> = {
  guitar: '🎸',
  piano: '🎹',
  drums: '🥁',
  banjo: '🪕',
};

export const ClassCalendar = ({ classes, isLoading }: ClassCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDayOfWeek = getDay(monthStart);

  const getClassesForDay = (day: Date) => {
    return classes.filter(cls => isSameDay(new Date(cls.scheduled_at), day));
  };

  const handleRegister = async (classId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('live_class_registrations')
        .insert({
          user_id: user.id,
          live_class_id: classId,
        });

      if (error) throw error;

      toast({
        title: '¡Registrado!',
        description: 'Te has inscrito a la clase exitosamente.',
      });

      queryClient.invalidateQueries({ queryKey: ['upcoming-classes'] });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo completar el registro.',
        variant: 'destructive',
      });
    }
  };

  const upcomingClassesList = classes.slice(0, 5);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-primary" />
              Calendario
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                ←
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="py-2 text-muted-foreground font-medium">
                {day}
              </div>
            ))}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="py-2" />
            ))}
            {days.map((day) => {
              const dayClasses = getClassesForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`py-2 relative rounded-md transition-colors ${
                    isToday ? 'bg-primary text-primary-foreground' : ''
                  } ${dayClasses.length > 0 ? 'font-semibold' : ''}`}
                >
                  {format(day, 'd')}
                  {dayClasses.length > 0 && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-secondary rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Classes List */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="w-5 h-5 text-primary" />
            Próximas Clases
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : upcomingClassesList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No hay clases programadas</p>
            </div>
          ) : (
            upcomingClassesList.map((cls) => (
              <div
                key={cls.id}
                className="p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {cls.instrument ? instrumentEmojis[cls.instrument] || '🎵' : '🎵'}
                      </span>
                      <h4 className="font-medium text-foreground truncate">{cls.title}</h4>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(cls.scheduled_at), "d 'de' MMM", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(cls.scheduled_at), 'HH:mm')}
                      </span>
                      {cls.duration_minutes && (
                        <span>{cls.duration_minutes} min</span>
                      )}
                    </div>
                  </div>
                  {cls.isRegistered ? (
                    <Badge variant="secondary" className="bg-secondary/20 text-secondary shrink-0">
                      Inscrito
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRegister(cls.id)}
                      className="shrink-0"
                    >
                      Inscribirse
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
