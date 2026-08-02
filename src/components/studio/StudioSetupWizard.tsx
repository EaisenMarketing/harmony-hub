import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, Copy, Loader2, Rocket, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { INSTRUMENT_PLANS } from '@/lib/instrument-access';
import { studioInviteUrl } from '@/lib/teacher-plans';
import {
  useStudioCourses,
  useStudioStudents,
  useSaveStudioCourse,
  useSaveStudioStudent,
  useUpdateTeacherAccount,
  type TeacherAccount,
} from '@/hooks/useTeacherStudio';

const LEVELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const dismissKey = (id: string) => `studio-setup-dismissed-${id}`;

export const StudioSetupWizard = ({ account }: { account: TeacherAccount }) => {
  const { data: courses } = useStudioCourses(account.id);
  const { data: students } = useStudioStudents(account.id);
  const updateAccount = useUpdateTeacherAccount();
  const saveCourse = useSaveStudioCourse();
  const saveStudent = useSaveStudioStudent();

  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(dismissKey(account.id)) === '1',
  );
  const [step, setStep] = useState<number | null>(null);

  const [profile, setProfile] = useState({
    studio_name: account.studio_name ?? '',
    primary_instrument: account.primary_instrument ?? 'guitar',
    contact_email: account.contact_email ?? '',
    phone: account.phone ?? '',
    bio: account.bio ?? '',
  });
  const [course, setCourse] = useState({
    title: '',
    description: '',
    level: 'beginner',
  });
  const [student, setStudent] = useState({ full_name: '', email: '' });

  const doneProfile = Boolean(account.primary_instrument && account.bio && account.bio.trim().length > 0);
  const doneCourse = (courses?.length ?? 0) > 0;
  const doneStudent = (students?.length ?? 0) > 0;

  const steps = useMemo(
    () => [
      { id: 1, title: 'Configura tu estudio', desc: 'Instrumento, contacto y presentación', done: doneProfile },
      { id: 2, title: 'Crea tu primer curso', desc: 'Un curso con nombre y nivel', done: doneCourse },
      { id: 3, title: 'Invita a tu primer alumno', desc: 'Por email o con tu enlace', done: doneStudent },
    ],
    [doneProfile, doneCourse, doneStudent],
  );

  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (dismissed || allDone) return null;

  const dismiss = () => {
    localStorage.setItem(dismissKey(account.id), '1');
    setDismissed(true);
  };

  const openNext = () => setStep(steps.find((s) => !s.done)?.id ?? null);

  const saveProfile = async () => {
    if (profile.studio_name.trim().length < 3) {
      toast({ title: 'Nombre muy corto', description: 'Mínimo 3 caracteres.', variant: 'destructive' });
      return;
    }
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        studio_name: profile.studio_name.trim(),
        primary_instrument: profile.primary_instrument,
        contact_email: profile.contact_email || null,
        phone: profile.phone || null,
        bio: profile.bio || null,
      });
      toast({ title: 'Estudio configurado' });
      setStep(2);
    } catch (e) {
      toast({ title: 'No se pudo guardar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const createCourse = async () => {
    if (course.title.trim().length < 3) {
      toast({ title: 'Ponle un título a tu curso', variant: 'destructive' });
      return;
    }
    try {
      await saveCourse.mutateAsync({
        teacher_account_id: account.id,
        title: course.title.trim(),
        description: course.description || null,
        instrument: account.primary_instrument ?? profile.primary_instrument,
        level: course.level,
        is_published: true,
      });
      toast({ title: '¡Curso creado!', description: 'Ya puedes subirle lecciones desde “Cursos”.' });
      setStep(3);
    } catch (e) {
      toast({ title: 'No se pudo crear', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const inviteStudent = async () => {
    if (!student.full_name.trim() || !/^\S+@\S+\.\S+$/.test(student.email)) {
      toast({ title: 'Datos incompletos', description: 'Nombre y email válido.', variant: 'destructive' });
      return;
    }
    try {
      await saveStudent.mutateAsync({
        teacher_account_id: account.id,
        full_name: student.full_name.trim(),
        email: student.email.trim().toLowerCase(),
        instrument: account.primary_instrument ?? profile.primary_instrument,
        status: 'invited',
      });
      toast({
        title: '¡Alumno invitado!',
        description: 'Comparte tu enlace de invitación para que active su acceso.',
      });
      setStep(null);
    } catch (e) {
      toast({ title: 'No se pudo invitar', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const copyInvite = async () => {
    const url = studioInviteUrl(account.invite_code);
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Enlace copiado', description: 'Compártelo por WhatsApp o email.' });
    } catch {
      toast({ title: 'Copia manualmente', description: url });
    }
  };

  return (
    <Card className="p-4 md:p-5 bg-gradient-to-br from-primary/10 to-transparent border-white/10 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-primary/15 shrink-0">
            <Rocket className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">Pon tu estudio en marcha</h3>
            <p className="text-xs text-muted-foreground">
              3 pasos y en minutos tus alumnos ya pueden entrar.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary">{completed}/{steps.length}</Badge>
          <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Ocultar asistente">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(step === s.id ? null : s.id)}
            className={cn(
              'w-full flex items-center gap-3 text-left p-3 rounded-xl border transition-colors',
              step === s.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/25',
            )}
          >
            <span
              className={cn(
                'w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold shrink-0',
                s.done ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-muted-foreground',
              )}
            >
              {s.done ? <Check className="w-3.5 h-3.5" /> : s.id}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-sm font-medium', s.done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                {s.title}
              </span>
              <span className="block text-xs text-muted-foreground">{s.desc}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <Label>Nombre del estudio</Label>
            <Input
              value={profile.studio_name}
              onChange={(e) => setProfile({ ...profile, studio_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Instrumento principal</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {INSTRUMENT_PLANS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setProfile({ ...profile, primary_instrument: i.id })}
                  className={cn(
                    'shrink-0 px-3 py-2 rounded-xl border text-xs font-medium transition-colors',
                    profile.primary_instrument === i.id
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-white/10 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="mr-1">{i.emoji}</span>
                  {i.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email de contacto</Label>
              <Input
                type="email"
                value={profile.contact_email}
                onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Presentación para tus alumnos</Label>
            <Textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Soy maestro de guitarra con 10 años de experiencia…"
            />
          </div>
          <Button onClick={saveProfile} disabled={updateAccount.isPending} className="w-full sm:w-auto">
            {updateAccount.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar y continuar
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 pt-1">
          <div className="space-y-2">
            <Label>Título del curso</Label>
            <Input
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
              placeholder="Ej. Guitarra desde cero"
            />
          </div>
          <div className="space-y-2">
            <Label>Descripción (opcional)</Label>
            <Textarea rows={2} value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Nivel</Label>
            <div className="flex gap-2">
              {Object.entries(LEVELS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCourse({ ...course, level: k })}
                  className={cn(
                    'px-3 py-2 rounded-xl border text-xs font-medium transition-colors',
                    course.level === k
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-white/10 text-muted-foreground hover:text-foreground',
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={createCourse} disabled={saveCourse.isPending}>
              {saveCourse.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear curso
            </Button>
            <Button variant="outline" asChild>
              <Link to="/estudio/cursos">Agregar lecciones</Link>
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 pt-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre del alumno</Label>
              <Input value={student.full_name} onChange={(e) => setStudent({ ...student, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={student.email}
                onChange={(e) => setStudent({ ...student, email: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={inviteStudent} disabled={saveStudent.isPending}>
              {saveStudent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Invitar alumno
            </Button>
            <Button variant="outline" onClick={copyInvite}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar enlace
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground break-all">{studioInviteUrl(account.invite_code)}</p>
        </div>
      )}

      {step === null && (
        <Button size="sm" onClick={openNext} className="w-full sm:w-auto">
          Continuar con el siguiente paso
        </Button>
      )}
    </Card>
  );
};
