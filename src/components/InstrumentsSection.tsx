import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import guitarImage from '@/assets/guitar-card.webp';
import pianoImage from '@/assets/piano-card.webp';
import { ScrollReveal, Parallax } from '@/components/landing/ScrollReveal';
import { motion } from 'framer-motion';

const instruments = [
  {
    name: 'Guitarra',
    description: 'Acústica y eléctrica. Desde acordes básicos hasta solos avanzados con técnicas profesionales.',
    image: guitarImage,
    levels: ['Básico', 'Intermedio', 'Avanzado'],
    courses: 24,
    gradient: 'from-primary/80 to-indigo-700/80',
    accent: 'hsl(239, 84%, 67%)',
  },
  {
    name: 'Piano',
    description: 'Técnica clásica y moderna. Lectura de partituras, improvisación y composición.',
    image: pianoImage,
    levels: ['Básico', 'Intermedio', 'Avanzado'],
    courses: 18,
    gradient: 'from-secondary/80 to-emerald-700/80',
    accent: 'hsl(160, 84%, 39%)',
  },
];

export function InstrumentsSection() {
  return (
    <section id="instrumentos" className="py-32 bg-[hsl(222,47%,7%)] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.span 
              className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
              whileHover={{ scale: 1.05 }}
            >
              Instrumentos
            </motion.span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
              Elige tu instrumento y{' '}
              <span className="gradient-text">comienza hoy</span>
            </h2>
            <p className="text-lg text-white/50">
              Cursos estructurados por niveles con material descargable, ejercicios prácticos y feedback personalizado.
            </p>
          </div>
        </ScrollReveal>

        {/* Two-column centered layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {instruments.map((instrument, index) => (
            <ScrollReveal key={instrument.name} delay={index * 0.15} direction={index % 2 === 0 ? 'up' : 'down'}>
              <Parallax speed={0.2 * (index % 2 === 0 ? 1 : -1)}>
                <motion.div
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl overflow-hidden border border-white/[0.06] hover:border-white/20"
                >
                  <div className="relative h-72 overflow-hidden">
                    <motion.img
                      src={instrument.image}
                      alt={instrument.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.7 }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${instrument.gradient} opacity-40 group-hover:opacity-60 transition-opacity duration-500`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,7%)] via-transparent to-transparent" />
                    
                    <motion.div 
                      className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-bold border border-white/10"
                      whileHover={{ scale: 1.1 }}
                    >
                      {instrument.courses} cursos
                    </motion.div>

                    <div 
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                      style={{ backgroundColor: instrument.accent }}
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:gradient-text transition-all duration-300">
                      {instrument.name}
                    </h3>
                    <p className="text-sm text-white/40 mb-4 leading-relaxed">
                      {instrument.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {instrument.levels.map((level) => (
                        <span
                          key={level}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/5 text-white/50 border border-white/5"
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                    <Link to="/auth">
                      <Button variant="outline" className="w-full group/btn border-white/10 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/20">
                        Ver cursos
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </Parallax>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
