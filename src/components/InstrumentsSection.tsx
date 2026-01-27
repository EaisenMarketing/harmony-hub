import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import guitarImage from '@/assets/guitar-card.jpg';
import pianoImage from '@/assets/piano-card.jpg';
import drumsImage from '@/assets/drums-card.jpg';
import banjoImage from '@/assets/banjo-card.jpg';

const instruments = [
  {
    name: 'Guitarra',
    description: 'Acústica y eléctrica. Desde acordes básicos hasta solos avanzados.',
    image: guitarImage,
    levels: ['Básico', 'Intermedio', 'Avanzado'],
    courses: 24,
    color: 'from-orange-500 to-amber-600',
  },
  {
    name: 'Piano',
    description: 'Técnica clásica y moderna. Lectura de partituras y improvisación.',
    image: pianoImage,
    levels: ['Básico', 'Intermedio', 'Avanzado'],
    courses: 18,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    name: 'Batería',
    description: 'Ritmos, fills y técnicas de profesionales del rock y jazz.',
    image: drumsImage,
    levels: ['Básico', 'Intermedio', 'Avanzado'],
    courses: 16,
    color: 'from-rose-500 to-red-600',
  },
  {
    name: 'Banjo',
    description: 'Bluegrass, folk y técnicas de fingerpicking auténticas.',
    image: banjoImage,
    levels: ['Básico', 'Intermedio', 'Avanzado'],
    courses: 12,
    color: 'from-emerald-500 to-teal-600',
  },
];

export function InstrumentsSection() {
  return (
    <section id="instrumentos" className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Instrumentos
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Elige tu instrumento y{' '}
            <span className="gradient-text">comienza hoy</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Cursos estructurados por niveles con material descargable, ejercicios prácticos y feedback personalizado.
          </p>
        </div>

        {/* Instruments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {instruments.map((instrument, index) => (
            <div
              key={instrument.name}
              className="group relative bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={instrument.image}
                  alt={instrument.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${instrument.color} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                
                {/* Course Count Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
                  {instrument.courses} cursos
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-card-foreground mb-2">
                  {instrument.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {instrument.description}
                </p>

                {/* Levels */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {instrument.levels.map((level) => (
                    <span
                      key={level}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground"
                    >
                      {level}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link to="/auth">
                  <Button variant="outline" className="w-full group/btn">
                    Ver cursos
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
