import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import liveClassImage from '@/assets/acorde-live-clase-en-vivo-2.png.asset.json';

const points = [
  'Clases en vivo por Zoom con maestros profesionales',
  'Grupos reducidos según tu nivel y horario',
  'Material y clases grabadas disponibles 24/7',
];

export function LiveExperienceSection() {
  return (
    <section id="experiencia" className="py-24 bg-[hsl(222,47%,7%)] relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[420px] h-[420px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[360px] h-[360px] bg-secondary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl gradient-bg opacity-20 blur-2xl" aria-hidden="true" />
            <img
              src={liveClassImage.url}
              alt="Alumno de Acorde Live tomando una clase de guitarra en vivo por videollamada"
              loading="lazy"
              decoding="async"
              className="relative w-full rounded-2xl border border-white/10 shadow-2xl"
            />
          </div>

          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-6 border border-secondary/20">
              La experiencia Acorde Live
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
              Aprende desde casa, <span className="gradient-text">como si estuvieras ahí</span>
            </h2>
            <p className="text-lg text-white/50 mb-8 leading-relaxed">
              Tu maestro te ve, te escucha y te corrige en tiempo real. Elige tu instrumento,
              conéctate a tu clase semanal y sigue practicando con el contenido on-demand.
            </p>
            <ul className="space-y-3 mb-10">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full gradient-bg flex-shrink-0" />
                  <span className="text-white/70">{p}</span>
                </li>
              ))}
            </ul>
            <Link to="/empezar">
              <Button variant="gradient" size="lg">
                Comenzar prueba de 3 días
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
