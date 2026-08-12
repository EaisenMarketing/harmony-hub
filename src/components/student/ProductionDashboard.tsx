import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Headphones, Play, FileText, Lock, Sliders, Music4, Layers,
  Calendar, Download, ArrowRight,
} from 'lucide-react';
import { useUserInstrument } from '@/hooks/useUserInstrument';
import { format, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

const dawTools = [
  { name: 'Ableton Live', tag: 'DAW principal', desc: 'Flujo de trabajo para producción electrónica y directo.' },
  { name: 'Logic Pro', tag: 'DAW / mezcla', desc: 'Suite completa de Apple con plugins pro incluidos.' },
  { name: 'FL Studio', tag: 'Beatmaking', desc: 'Ideal para hip-hop, trap y música electrónica.' },
  { name: 'Pro Tools', tag: 'Mezcla / master', desc: 'Estándar de la industria en estudios profesionales.' },
  { name: 'Serum', tag: 'Sintetizador', desc: 'Wavetable synth muy usado en producción moderna.' },
  { name: 'FabFilter Pro-Q', tag: 'EQ mezcla', desc: 'EQ paramétrico transparente y quirúrgico.' },
];

const sampleCategories = [
  { name: 'Drum Kits', icon: '🥁', count: 'Kits de trap, house y techno' },
  { name: 'Loops melódicos', icon: '🎹', count: 'Loops en distintas tonalidades' },
  { name: 'Presets de sintes', icon: '🎛️', count: 'Serum, Vital, Massive' },
  { name: 'One-shots', icon: '💥', count: 'Kicks, snares, hats sueltos' },
];

export const ProductionDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: userIns } = useUserInstrument();
  const isProduction = userIns?.instrument === 'production';

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['production-courses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, thumbnail_url, level, duration_hours, required_plan')
        .eq('is_published', true)
        .eq('required_plan', 'production')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isProduction,
  });

  const { data: liveClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: ['production-live-classes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_classes')
        .select('id, title, description, scheduled_at, duration_minutes, recording_url, required_plan')
        .eq('required_plan', 'production')
        .order('scheduled_at', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isProduction,
  });

  if (!isProduction) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center mb-4">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <Badge variant="secondary" className="gap-1 mb-3">
              <Lock className="w-3 h-3" /> Solo plan Producción Musical
            </Badge>
            <h3 className="text-xl font-bold mb-2">Producción Musical</h3>
            <p className="text-muted-foreground mb-5 max-w-md">
              Este dashboard está reservado para estudiantes del plan de Producción Musical.
              Cambia tu instrumento activo a Producción Musical para acceder a los cursos de DAW, mezcla, mastering y la biblioteca
              de samples.
            </p>
            <Button variant="gradient" onClick={() => navigate('/precios')}>
              Ver planes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent border border-violet-500/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg">
            <Headphones className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Producción Musical</h1>
              <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0">Plan activo</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Tu estudio digital: cursos, sesiones en vivo, DAWs y samples.
            </p>
          </div>
        </div>
      </div>

      {/* Cursos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Music4 className="w-5 h-5 text-violet-500" /> Cursos de Producción
          </h2>
        </div>
        {coursesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse"><div className="h-40 bg-muted" /><CardContent className="p-4 h-20" /></Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            Aún no hay cursos de producción publicados. Vuelve pronto.
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Card key={c.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/portal/curso/${c.id}`)}>
                <div className="relative h-40 bg-muted">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={c.title} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20">
                      <Music4 className="w-12 h-12 text-violet-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                  <Button className="w-full mt-3" size="sm">
                    <Play className="w-4 h-4 mr-2" /> Abrir curso
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Clases en vivo */}
      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-violet-500" /> Clases en vivo de Producción
        </h2>
        {classesLoading ? (
          <Card className="animate-pulse h-24" />
        ) : liveClasses.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            No hay clases programadas por ahora.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {liveClasses.map((cls) => {
              const upcoming = isFuture(new Date(cls.scheduled_at));
              return (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-start justify-between gap-2">
                      <span className="flex items-center gap-2"><Play className="w-4 h-4 text-violet-500" />{cls.title}</span>
                      <Badge variant={upcoming ? 'default' : 'secondary'} className="shrink-0">
                        {upcoming ? 'Próxima' : 'Grabada'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(new Date(cls.scheduled_at), "d 'de' MMMM, HH:mm", { locale: es })}
                      {cls.duration_minutes ? ` · ${cls.duration_minutes} min` : ''}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{cls.description}</p>
                    {cls.recording_url && (
                      <Button size="sm" variant="outline" className="gap-1">
                        <Play className="w-3 h-3" /> Ver grabación
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* DAW / Mezcla */}
      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-violet-500" /> Herramientas DAW / Mezcla
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dawTools.map((t) => (
            <Card key={t.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{t.name}</h3>
                  <Badge variant="outline" className="text-xs">{t.tag}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Samples / Presets */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-500" /> Biblioteca de Samples / Presets
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sampleCategories.map((s) => (
            <Card key={s.name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="text-xs text-muted-foreground">{s.count}</p>
                <Button size="sm" variant="ghost" className="mt-3 gap-1 -ml-2">
                  <Download className="w-3 h-3" /> Explorar <ArrowRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <FileText className="w-3 h-3 inline mr-1" />
          El equipo subirá nuevos packs mensualmente. Recibirás una notificación cuando estén disponibles.
        </p>
      </section>
    </div>
  );
};
