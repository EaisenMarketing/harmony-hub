import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Headphones, Mic, Music, Sliders, Waves, Sparkles } from 'lucide-react';
import productionImage from '@/assets/production-card.webp';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { motion } from 'framer-motion';

const features = [
  { icon: Sliders, title: 'Mezcla & Mastering', desc: 'Técnicas profesionales de mezcla y mastering de audio' },
  { icon: Mic, title: 'Grabación', desc: 'Configuración de estudio y técnicas de grabación' },
  { icon: Waves, title: 'Diseño Sonoro', desc: 'Crea sonidos únicos con sintetizadores y samplers' },
  { icon: Headphones, title: 'DAWs Profesionales', desc: 'Domina Ableton, Logic Pro, FL Studio y más' },
];

export function MusicProductionSection() {
  return (
    <section id="produccion" className="py-32 bg-[hsl(222,47%,5%)] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[200px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-[150px]" />
      </div>

      {/* Animated border line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-6">
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-white/90 uppercase tracking-wider">Nuevo Programa</span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </motion.div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Image side */}
          <ScrollReveal direction="left">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative rounded-2xl overflow-hidden border border-white/10 group"
            >
              <img
                src={productionImage}
                alt="Estudio de producción musical"
                loading="lazy"
                decoding="async"
                className="w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,5%)] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Floating badge */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                  <Music className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-white text-sm font-bold">Estudio Virtual Completo</p>
                    <p className="text-white/40 text-xs">Acceso a plugins y recursos profesionales</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>

          {/* Content side */}
          <ScrollReveal direction="right">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                Producción Musical{' '}
                <span className="gradient-text">Profesional</span>
              </h2>
              <p className="text-lg text-white/50 mb-10 leading-relaxed">
                Aprende a producir, mezclar y masterizar música como un profesional. 
                Desde la idea hasta la publicación, con mentores activos en la industria musical.
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {features.map((feature, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/20 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm mb-1">{feature.title}</h4>
                      <p className="text-white/40 text-xs leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button variant="gradient" size="lg" className="group">
                    Explorar Programa
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#precios">
                  <Button variant="outline" size="lg" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5 hover:border-white/20">
                    Ver Precios
                  </Button>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
