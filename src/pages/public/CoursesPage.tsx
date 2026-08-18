import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { PUBLIC_INSTRUMENTS, instrumentLabel } from '@/lib/instruments';

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
  required_plan: string | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('courses')
      .select('id,title,slug,short_description,description,instrument,level,cover_image_url,thumbnail_url,required_plan')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setCourses((data ?? []) as Course[]);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all' ? courses : courses.filter(c => c.instrument === filter);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: filtered.slice(0, 20).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `https://acordelive.com/cursos/${c.slug ?? c.id}`,
      name: c.title,
    })),
  };

  return (
    <PublicLayout>
      <Seo
        title="Cursos de música online"
        description="Explora todos los cursos de Acorde Live: guitarra acústica y eléctrica, bajo, batería, piano y trompeta."
        path="/cursos"
        jsonLd={itemListJsonLd}
      />
      <div className="container mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Cursos</h1>
          <p className="text-white/60 max-w-2xl">
            Cursos guiados por maestros profesionales. Tu plan incluye un instrumento activo: elige el tuyo y empieza hoy.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg border text-sm transition-colors ${filter==='all' ? 'bg-white text-black border-white' : 'border-white/20 text-white/70 hover:bg-white/10'}`}
          >
            Todos
          </button>
          {PUBLIC_INSTRUMENTS.map(i => (
            <button
              key={i.id}
              onClick={() => setFilter(i.id)}
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${filter===i.id ? 'bg-white text-black border-white' : 'border-white/20 text-white/70 hover:bg-white/10'}`}
            >
              {i.emoji} {i.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-white/50">Cargando cursos…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            <p className="mb-4">Todavía no hay cursos publicados para este instrumento.</p>
            <Link to="/precios" className="text-primary underline">Ver planes disponibles</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(c => (
              <Link
                key={c.id}
                to={`/cursos/${c.slug ?? c.id}`}
                className="group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-primary/30 transition-colors"
              >
                <div className="aspect-video bg-white/5 overflow-hidden">
                  {(c.cover_image_url || c.thumbnail_url) && (
                    <img
                      src={c.cover_image_url ?? c.thumbnail_url ?? ''}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                    {instrumentLabel(c.instrument)} · {c.level ?? 'Todos los niveles'}
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2 line-clamp-2">{c.title}</h2>
                  {(c.short_description || c.description) && (
                    <p className="text-sm text-white/60 line-clamp-3">
                      {c.short_description ?? c.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
