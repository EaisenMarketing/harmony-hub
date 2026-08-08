import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Megaphone, BookOpen, ArrowLeft, Music, CalendarClock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMyStudioMembership,
  useMyStudioLiveClasses,
  useMyStudioAnnouncements,
  useMyStudioCourses,
  useMyClassRegistrations,
  useRegisterToStudioClass,
  type StudioLiveClass,
} from '@/hooks/useTeacherStudio';
import { StudioClassRoom } from '@/components/studio/StudioClassRoom';
import { Seo } from '@/lib/seo';

const MyStudioPage = () => {
  const { user, loading } = useAuth();
  const { data: membership, isLoading } = useMyStudioMembership();
  const accountId = membership?.studio?.id;
  const { data: classes = [] } = useMyStudioLiveClasses(accountId);
  const { data: announcements = [] } = useMyStudioAnnouncements(accountId);
  const { data: courses = [] } = useMyStudioCourses(accountId);
  const { data: registrations = [] } = useMyClassRegistrations();
  const register = useRegisterToStudioClass();
  const [room, setRoom] = useState<StudioLiveClass | null>(null);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !membership?.studio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-6 max-w-md text-center bg-card/70 border-white/10 space-y-3">
          <Music className="w-8 h-8 text-primary mx-auto" />
          <h1 className="text-lg font-bold text-foreground">Todavía no perteneces a un estudio</h1>
          <p className="text-sm text-muted-foreground">
            Si tu maestro te compartió un enlace de invitación, ábrelo para unirte a su estudio.
          </p>
          <Button asChild>
            <Link to="/portal">Ir a mi portal</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const now = Date.now();
  const upcoming = classes.filter(
    (c) => new Date(c.scheduled_at).getTime() >= now - 60 * 60 * 1000,
  );
  const registeredIds = new Set(registrations.map((r) => r.live_class_id));

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Mi estudio | Acorde Live" description="Clases en vivo, avisos y cursos de tu maestro." noindex />
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portal">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Portal
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{membership.studio.studio_name}</h1>
            <p className="text-xs text-muted-foreground">Tu estudio en Acorde Live</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" />
            Próximas clases en vivo
          </h2>
          {upcoming.length === 0 ? (
            <Card className="p-5 text-center bg-card/70 border-white/10">
              <Video className="w-7 h-7 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Tu maestro no tiene clases programadas por ahora.
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {upcoming.map((c) => {
                const date = new Date(c.scheduled_at);
                const isRegistered = registeredIds.has(c.id);
                return (
                  <Card key={c.id} className="p-4 bg-card/70 border-white/10 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-bold leading-none">{format(date, 'd')}</span>
                        <span className="text-[10px] uppercase">{format(date, 'MMM', { locale: es })}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{c.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(date, "EEEE d 'de' MMMM · HH:mm 'hrs'", { locale: es })} ·{' '}
                          {c.duration_minutes} min
                        </p>
                        {isRegistered && (
                          <Badge variant="secondary" className="mt-1">
                            Inscrito
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setRoom(c)}>
                        <Video className="w-4 h-4 mr-2" />
                        Entrar a la clase
                      </Button>
                      {!isRegistered && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={register.isPending}
                          onClick={async () => {
                            try {
                              await register.mutateAsync({ accountId: accountId!, classId: c.id });
                              toast({ title: 'Inscripción confirmada' });
                            } catch (e) {
                              toast({
                                title: 'No se pudo inscribir',
                                description: e instanceof Error ? e.message : '',
                                variant: 'destructive',
                              });
                            }
                          }}
                        >
                          Inscribirme
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            Avisos de tu maestro
          </h2>
          {announcements.length === 0 ? (
            <Card className="p-5 text-center bg-card/70 border-white/10">
              <p className="text-sm text-muted-foreground">Sin avisos por ahora.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <Card key={a.id} className="p-4 bg-card/70 border-white/10">
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{a.body}</p>
                  {a.link && (
                    <Button size="sm" variant="outline" className="mt-2" asChild>
                      <a href={a.link} target="_blank" rel="noreferrer">
                        Abrir enlace
                      </a>
                    </Button>
                  )}
                  <p className="text-[11px] text-muted-foreground/70 mt-2">
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: es })}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Cursos de tu maestro
          </h2>
          {courses.length === 0 ? (
            <Card className="p-5 text-center bg-card/70 border-white/10">
              <p className="text-sm text-muted-foreground">Tu maestro aún no publica cursos.</p>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {courses.map((c) => (
                <Card key={c.id} className="p-4 bg-card/70 border-white/10">
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.teacher_lessons?.length ?? 0} lecciones · {c.level}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">{c.description}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <StudioClassRoom
        liveClass={room}
        onClose={() => setRoom(null)}
        studioName={membership.studio.studio_name}
      />
    </div>
  );
};

export default MyStudioPage;
