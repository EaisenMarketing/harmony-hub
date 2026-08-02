import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TEACHER_PLANS } from '@/lib/teacher-plans';
import { Check, GraduationCap, Sparkles, Users, ClipboardList } from 'lucide-react';

const benefits = [
  {
    icon: Users,
    title: 'Tus alumnos, tu estudio',
    text: 'Invita a tus alumnos con un enlace y administra su avance en un panel privado.',
  },
  {
    icon: GraduationCap,
    title: 'Tus propios cursos',
    text: 'Sube tus lecciones, videos y materiales. Tu contenido es solo tuyo.',
  },
  {
    icon: Sparkles,
    title: 'Herramientas de IA incluidas',
    text: 'Coach de práctica, entrenador de oído, metrónomo, afinador y creador de acordes.',
  },
  {
    icon: ClipboardList,
    title: 'Tareas y seguimiento',
    text: 'Asigna tareas con fecha límite y revisa quién practicó y quién no.',
  },
];

const StudioPlansPage = () => (
  <PublicLayout>
    <Seo
      title="Planes para maestros de música — Acorde Live"
      description="Ofrece clases digitales a tus alumnos con tu propio estudio en Acorde Live: cursos, tareas, seguimiento y herramientas de IA desde $39 al mes."
      path="/maestros/planes"
    />

    <section className="max-w-6xl mx-auto px-4 pb-20">
      <div className="text-center max-w-2xl mx-auto">
        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
          Para maestros y escuelas de música
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold text-foreground mt-4">
          Tu propia plataforma para enseñar música
        </h1>
        <p className="text-muted-foreground mt-4">
          Digitaliza tus clases con la tecnología de Acorde Live: tus cursos, tus alumnos y todas
          nuestras herramientas de práctica e inteligencia artificial. 14 días de prueba, sin tarjeta.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to="/estudio">
            <Button size="lg">Crear mi estudio gratis</Button>
          </Link>
          <Link to="/contacto">
            <Button size="lg" variant="outline">
              Hablar con el equipo
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
        {benefits.map((b) => (
          <Card key={b.title} className="p-5 bg-card/70 border-white/10">
            <b.icon className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-foreground mt-3">{b.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{b.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
          Planes según el tamaño de tu estudio
        </h2>
        <p className="text-muted-foreground text-center mt-2">
          Cambia de plan cuando quieras. El límite es de alumnos activos.
        </p>

        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {TEACHER_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={
                plan.highlight
                  ? 'p-6 bg-card border-primary/40 ring-1 ring-primary/30 relative'
                  : 'p-6 bg-card/70 border-white/10'
              }
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Más elegido</Badge>
              )}
              <h3 className="text-lg font-bold text-foreground">{plan.label}</h3>
              <p className="text-xs text-muted-foreground mt-1 min-h-[2.5rem]">{plan.tagline}</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                <span className="text-sm text-muted-foreground"> /mes</span>
              </p>
              <p className="text-xs text-primary mt-1">Hasta {plan.seats} alumnos activos</p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/estudio" className="block mt-6">
                <Button className="w-full" variant={plan.highlight ? 'default' : 'outline'}>
                  Empezar prueba de 14 días
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  </PublicLayout>
);

export default StudioPlansPage;
