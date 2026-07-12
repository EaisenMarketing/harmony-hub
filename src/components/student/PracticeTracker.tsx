import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, Flame, TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

export const PracticeTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [minutes, setMinutes] = useState('30');
  const [instrument, setInstrument] = useState('guitar');
  const [weeklyGoal, setWeeklyGoal] = useState('120');
  const [notes, setNotes] = useState('');

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: sessions = [] } = useQuery({
    queryKey: ['practice-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const twoWeeksAgo = format(subWeeks(today, 2), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', twoWeeksAgo)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const logPractice = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Check if entry exists for today+instrument
      const { data: existing } = await supabase
        .from('practice_sessions')
        .select('id, duration_minutes')
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .eq('instrument', instrument)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('practice_sessions')
          .update({ 
            duration_minutes: existing.duration_minutes + parseInt(minutes),
            notes: notes || null,
            weekly_goal_minutes: parseInt(weeklyGoal)
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            date: todayStr,
            duration_minutes: parseInt(minutes),
            instrument,
            notes: notes || null,
            weekly_goal_minutes: parseInt(weeklyGoal)
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-sessions'] });
      toast.success('¡Práctica registrada!');
      setNotes('');
    },
    onError: () => toast.error('Error al registrar práctica'),
  });

  // Weekly stats
  const thisWeekSessions = sessions.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && d <= weekEnd;
  });
  const weeklyMinutes = thisWeekSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const goalMinutes = parseInt(weeklyGoal);
  const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / goalMinutes) * 100));

  // Streak calculation
  let streak = 0;
  const sortedDates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  for (const date of sortedDates) {
    const expected = format(new Date(today.getTime() - streak * 86400000), 'yyyy-MM-dd');
    if (date === expected) streak++;
    else break;
  }

  // Day data for week view
  const getDayMinutes = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dayStr).reduce((sum, s) => sum + s.duration_minutes, 0);
  };

  const maxDayMinutes = Math.max(1, ...weekDays.map(getDayMinutes));

  const instrumentLabels: Record<string, string> = {
    guitar: '🎸 Guitarra',
    piano: '🎹 Piano',
    drums: '🥁 Batería',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">📊 Tracking de Práctica</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weeklyMinutes}</p>
              <p className="text-xs text-muted-foreground">min esta semana</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-secondary/10">
              <Target className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{weeklyProgress}%</p>
              <p className="text-xs text-muted-foreground">meta semanal</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{streak}</p>
              <p className="text-xs text-muted-foreground">días seguidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              <p className="text-xs text-muted-foreground">sesiones totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly progress bar */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Meta Semanal: {weeklyMinutes}/{goalMinutes} minutos</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={weeklyProgress} className="h-3" />
          
          {/* Week day bars */}
          <div className="flex items-end justify-between gap-1 mt-6 h-24">
            {weekDays.map(day => {
              const dayMin = getDayMinutes(day);
              const height = maxDayMinutes > 0 ? (dayMin / maxDayMinutes) * 100 : 0;
              const dayIsToday = isToday(day);
              return (
                <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{dayMin > 0 ? `${dayMin}m` : ''}</span>
                  <div className="w-full flex items-end h-16">
                    <div
                      className={`w-full rounded-t-sm transition-all ${dayIsToday ? 'bg-primary' : dayMin > 0 ? 'bg-primary/40' : 'bg-muted'}`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] ${dayIsToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE', { locale: es })}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Log practice form */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> Registrar Práctica de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Select value={instrument} onValueChange={setInstrument}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(instrumentLabels).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              max={480}
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              placeholder="Minutos"
            />
            <Input
              type="number"
              min={30}
              max={600}
              value={weeklyGoal}
              onChange={e => setWeeklyGoal(e.target.value)}
              placeholder="Meta semanal (min)"
            />
            <Button onClick={() => logPractice.mutate()} disabled={logPractice.isPending}>
              {logPractice.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </div>
          <Input
            className="mt-3"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas opcionales (ej: trabajé escalas pentatónicas)"
          />
        </CardContent>
      </Card>
    </div>
  );
};
