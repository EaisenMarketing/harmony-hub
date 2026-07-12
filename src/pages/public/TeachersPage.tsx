import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { instrumentLabel } from '@/lib/instruments';

interface Instructor {
  id: string;
  bio: string | null;
  instrument: string | null;
  specialization: string | null;
  years_experience: number | null;
}

export default function TeachersPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('instructor_profiles')
        .select('id, bio, instrument, specialization, years_experience')
        .eq('status', 'approved')
        .limit(50);
      setInstructors((data ?? []) as Instructor[]);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicLayout>
      <Seo
        title="Maestros"
        description="Conoce a los maestros profesionales de Acorde Live: guitarra, bajo, batería, piano, trompeta y producción musical."
        path="/maestros"
      />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Nuestros maestros</h1>
        <p className="text-white/60 max-w-2xl mb-10">
          Cada maestro pasa por un proceso de aplicación y revisión. Todos son músicos profesionales con experiencia enseñando.
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
                <div className="mb-3">
                  <div className="font-semibold text-white">
                    {i.specialization ?? 'Maestro de Acorde Live'}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-white/40 mt-1">
                    {instrumentLabel(i.instrument ?? '')}
                    {i.years_experience ? ` · ${i.years_experience} años de experiencia` : ''}
                  </div>
                </div>
                {i.bio && <p className="text-sm text-white/70 line-clamp-5">{i.bio}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
