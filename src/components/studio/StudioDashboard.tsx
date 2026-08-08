import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  Copy,
  TrendingUp,
  Sparkles,
  Video,
  Bell,

} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { studioInviteUrl, TEACHER_PLAN_MAP, TEACHER_STATUS_LABEL } from '@/lib/teacher-plans';
import { useStudioStats, type TeacherAccount } from '@/hooks/useTeacherStudio';
import { StudioSetupWizard } from './StudioSetupWizard';

export const StudioDashboard = ({ account }: { account: TeacherAccount }) => {
  const { data: stats } = useStudioStats(account.id);
  const plan = TEACHER_PLAN_MAP[account.plan];
  const inviteUrl = studioInviteUrl(account.invite_code);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast({ title: 'Enlace copiado', description: 'Compártelo con tus alumnos por WhatsApp o email.' });
    } catch {
      toast({ title: 'Copia manualmente', description: inviteUrl });
    }
  };

  const cards = [
    { label: 'Alumnos activos', value: stats?.activeStudents ?? 0, icon: Users, sub: `${stats?.invitedStudents ?? 0} invitados` },
    { label: 'Cursos', value: stats?.totalCourses ?? 0, icon: BookOpen, sub: `${stats?.publishedCourses ?? 0} publicados` },
    { label: 'Lecciones completadas', value: stats?.completedLessons ?? 0, icon: CheckCircle2, sub: `${stats?.completedThisWeek ?? 0} esta semana` },
    { label: 'Tareas pendientes', value: stats?.pendingAssignments ?? 0, icon: ClipboardList, sub: 'por revisar' },
  ];

  const seatsUsed = stats?.seatsUsed ?? 0;
  const pct = Math.min(100, Math.round((seatsUsed / account.seat_limit) * 100));

  return (
    <div className="space-y-5">
      <StudioSetupWizard account={account} />

      <Card className="p-4 md:p-5 bg-gradient-to-br from-primary/15 to-transparent border-white/10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{account.studio_name}</h2>
            <p className="text-xs text-muted-foreground">
              Plan {plan.label} · ${plan.price}/mes ·{' '}
              <Badge variant="secondary" className="align-middle">
                {TEACHER_STATUS_LABEL[account.status] ?? account.status}
              </Badge>
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-primary shrink-0" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Cupos usados</span>
            <span>
              {seatsUsed} / {account.seat_limit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" onClick={copyInvite} className="sm:w-auto">
            <Copy className="w-4 h-4 mr-2" />
            Copiar enlace de invitación
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/estudio/alumnos">Invitar alumno por email</Link>
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground break-all">{inviteUrl}</p>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="p-4 bg-card/70 border-white/10">
            <c.icon className="w-4 h-4 text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-[11px] text-muted-foreground/70">{c.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4 bg-card/70 border-white/10 space-y-2">
          <Video className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Clases en vivo (Zoom)</h3>
          <p className="text-xs text-muted-foreground">
            Conecta tu Zoom y programa clases: tus alumnos entran con un botón.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link to="/estudio/clases">Programar clase</Link>
          </Button>
        </Card>
        <Card className="p-4 bg-card/70 border-white/10 space-y-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Avisos y notificaciones</h3>
          <p className="text-xs text-muted-foreground">
            Manda avisos de horarios, tareas o recordatorios a tus alumnos.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link to="/estudio/avisos">Publicar aviso</Link>
          </Button>
        </Card>
        <Card className="p-4 bg-card/70 border-white/10 space-y-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Vista del alumno</h3>
          <p className="text-xs text-muted-foreground">
            Así ven tus alumnos su estudio: clases, avisos y cursos.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link to="/mi-estudio">Ver como alumno</Link>
          </Button>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3">

        <Card className="p-4 bg-card/70 border-white/10 space-y-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Sube tu contenido</h3>
          <p className="text-xs text-muted-foreground">
            Crea tus cursos y lecciones con tus propios videos y materiales.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link to="/estudio/cursos">Ir a cursos</Link>
          </Button>
        </Card>
        <Card className="p-4 bg-card/70 border-white/10 space-y-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Asigna tareas</h3>
          <p className="text-xs text-muted-foreground">
            Define rutinas semanales por alumno y revisa su avance.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link to="/estudio/tareas">Ir a tareas</Link>
          </Button>
        </Card>
        <Card className="p-4 bg-card/70 border-white/10 space-y-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Herramientas de IA</h3>
          <p className="text-xs text-muted-foreground">
            Coach de práctica, entrenador de oído, metrónomo, acordes y más.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link to="/estudio/herramientas">Abrir herramientas</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
};
