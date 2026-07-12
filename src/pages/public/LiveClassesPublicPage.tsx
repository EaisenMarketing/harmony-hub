import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { instrumentLabel } from '@/lib/instruments';

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  instrument: string;
  scheduled_at: string;
  duration_minutes: number;
  required_plan: string | null;
  max_attendees: number | null;
}

export default function LiveClassesPublicPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('live_classes')
      .select('id,title,description,instrument,scheduled_at,duration_minutes,required_plan,max_attendees')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(30)
      .then(({ data }) => {
        setClasses((data ?? []) as LiveClass[]);
        setLoading(false);
      });
  }, []);

  return (
    <PublicLayout>
      <Seo
        title="Clases en vivo por Zoom"
        description="Calendario de clases en vivo de Acorde Live: piano, guitarra, bajo, batería, trompeta y producción musical, semanales por Zoom."
        path="/clases-en-vivo"
      />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Clases en vivo</h1>
        <p className="text-white/60 max-w-2xl mb-10">
          Clases semanales por Zoom con maestros reales. Para asistir necesitas una suscripción activa.
        </p>

        {loading ? (
          <div className="text-white/50">Cargando calendario…</div>
        ) : classes.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            <p className="mb-4">Aún no hay clases en vivo agendadas. Vuelve pronto o revisa los planes.</p>
            <Link to="/precios" className="text-primary underline">Ver planes</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map(c => {
              const date = new Date(c.scheduled_at);
              return (
                <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-white/40 mb-1">
                      {instrumentLabel(c.instrument)} · Plan {c.required_plan ?? 'basic'}+
                    </div>
                    <h2 className="text-lg font-semibold text-white">{c.title}</h2>
                    <div className="text-sm text-white/60 mt-1">
                      {date.toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' })} · {c.duration_minutes} min
                    </div>
                  </div>
                  <Link
                    to="/precios"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-500 px-5 py-2 text-sm font-semibold text-white"
                  >
                    Registrarme
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
