import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';

interface Instructor {
  id: string;
  bio: string | null;
  instruments: string[] | null;
  photo_url: string | null;
  professional_title: string | null;
  years_experience: number | null;
  full_name?: string | null;
}

export default function TeachersPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Solo columnas seguras y públicas
      const { data } = await supabase
        .from('instructor_profiles')
        .select('id, bio, instruments, photo_url, professional_title, years_experience')
        .eq('is_active', true)
        .limit(50);
      setInstructors((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicLayout>
      <Seo
        title="Maestros"
        description="Conoce a los maestros profesionales de Acorde Live. Guitarra, bajo, batería, piano, trompeta y producción musical."
        path="/maestros"
      />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Nuestros maestros</h1>
        <p className="text-white/60 max-w-2xl mb-10">
          Cada maestro pasa por un proceso de aplicación y revisión.
          Todos son músicos profesionales con experiencia enseñando.
        </p>

        {loading ? (
          <div className="text-white/50">Cargando…</div>
        ) : instructors.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            <p className="mb-4">Estamos incorporando nuevos maestros. ¿Quieres ser parte?</p>
            <Link to="/ser-maestro" className="text-primary underline">Postularme como maestro</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map(i => (
              <article key={i.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-4 mb-4">
                  {i.photo_url && (
                    <img src={i.photo_url} alt={i.professional_title ?? 'Maestro'} className="w-16 h-16 rounded-full object-cover border border-white/10" loading="lazy" />
                  )}
                  <div>
                    <div className="font-semibold text-white">{i.professional_title ?? 'Maestro'}</div>
                    {i.years_experience && <div className="text-xs text-white/50">{i.years_experience} años de experiencia</div>}
                  </div>
                </div>
                {i.bio && <p className="text-sm text-white/70 line-clamp-4">{i.bio}</p>}
                {i.instruments && i.instruments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {i.instruments.map(inst => (
                      <span key={inst} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                        {inst}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
