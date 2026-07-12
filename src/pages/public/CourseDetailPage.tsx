import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo, SITE } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { instrumentLabel } from '@/lib/instruments';

interface Course {
  id: string;
  title: string;
  slug: string | null;
  short_description: string | null;
  description: string | null;
  instrument: string;
  level: string | null;
  cover_image_url: string | null;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  required_plan: string | null;
  duration_hours: number | null;
}

interface ModuleWithLessons {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: { id: string; title: string; is_free_preview: boolean; duration_minutes: number | null }[];
}

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('courses')
        .select('id,title,slug,short_description,description,instrument,level,cover_image_url,thumbnail_url,preview_video_url,required_plan,duration_hours')
        .eq('is_published', true)
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setCourse(data as Course);
      const { data: mods } = await supabase
        .from('course_modules')
        .select('id,title,description,sort_order,lessons(id,title,is_free_preview,duration_minutes)')
        .eq('course_id', data.id)
        .order('sort_order', { ascending: true });
      setModules((mods ?? []) as any);
      setLoading(false);
    })();
  }, [slug]);

  if (notFound) return <Navigate to="/cursos" replace />;
  if (loading || !course) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-white/50">Cargando curso…</div>
      </PublicLayout>
    );
  }

  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.short_description ?? course.description ?? '',
    provider: { '@type': 'Organization', name: SITE.name, sameAs: SITE.url },
    url: `${SITE.url}/cursos/${course.slug ?? course.id}`,
  };

  return (
    <PublicLayout>
      <Seo
        title={course.title}
        description={course.short_description ?? course.description?.slice(0, 155) ?? `Curso de ${instrumentLabel(course.instrument)} en Acorde Live.`}
        path={`/cursos/${course.slug ?? course.id}`}
        image={course.cover_image_url ?? course.thumbnail_url ?? undefined}
        jsonLd={jsonLd}
      />

      <div className="container mx-auto px-4 py-10">
        <nav className="text-sm text-white/40 mb-6">
          <Link to="/" className="hover:text-white">Inicio</Link> ·{' '}
          <Link to="/cursos" className="hover:text-white">Cursos</Link> ·{' '}
          <span className="text-white/70">{course.title}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr,360px] gap-10">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/50 mb-3">
              {instrumentLabel(course.instrument)} · {course.level ?? 'Todos los niveles'}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{course.title}</h1>
            {(course.short_description || course.description) && (
              <p className="text-lg text-white/70 mb-8">
                {course.short_description ?? course.description}
              </p>
            )}

            {(course.cover_image_url || course.thumbnail_url) && (
              <img
                src={course.cover_image_url ?? course.thumbnail_url ?? ''}
                alt={course.title}
                className="w-full rounded-2xl border border-white/10 mb-10"
                loading="eager"
                decoding="async"
              />
            )}

            {course.description && course.description !== course.short_description && (
              <section className="prose prose-invert max-w-none mb-10">
                <h2 className="text-white">Sobre este curso</h2>
                <p className="text-white/70 whitespace-pre-line">{course.description}</p>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Temario</h2>
              {modules.length === 0 ? (
                <p className="text-white/50">El temario se publicará próximamente.</p>
              ) : (
                <div className="space-y-4">
                  {modules.map((m, i) => (
                    <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <h3 className="font-semibold text-white mb-1">
                        Módulo {i + 1}: {m.title}
                      </h3>
                      {m.description && <p className="text-sm text-white/60 mb-3">{m.description}</p>}
                      <ul className="text-sm text-white/70 space-y-1.5">
                        {m.lessons.map(l => (
                          <li key={l.id} className="flex items-center justify-between">
                            <span>· {l.title}</span>
                            {l.is_free_preview && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Vista previa
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
              <div className="text-sm text-white/60">Incluido en:</div>
              <div className="text-lg font-semibold text-white capitalize">
                Plan {course.required_plan ?? 'basic'} o superior
              </div>
              <ul className="text-sm text-white/60 space-y-2">
                <li>· {totalLessons} lecciones</li>
                {course.duration_hours && <li>· ~{course.duration_hours} h de contenido</li>}
                <li>· Certificado digital al finalizar</li>
                <li>· Comunidad de estudiantes</li>
              </ul>
              <Link
                to={`/precios?course=${encodeURIComponent(course.slug ?? course.id)}`}
                className="block text-center w-full rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 py-3 font-semibold text-white"
              >
                Comenzar ahora
              </Link>
              <Link
                to={`/auth?next=${encodeURIComponent(`/cursos/${course.slug ?? course.id}`)}`}
                className="block text-center w-full rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}
