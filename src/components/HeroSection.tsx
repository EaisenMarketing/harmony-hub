import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Clock, Award, CheckCircle2, Play } from 'lucide-react';
import { AudioVisualizer3D } from '@/components/landing/AudioVisualizer3D';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { motion } from 'framer-motion';

const badges = [
  { icon: Video, text: 'Clases en vivo por Zoom' },
  { icon: Clock, text: 'Acceso 24/7' },
  { icon: Award, text: 'Certificados oficiales' },
];

const stats = [
  { value: '10K+', label: 'Estudiantes' },
  { value: '500+', label: 'Clases grabadas' },
  { value: '98%', label: 'Satisfacción' },
  { value: '4', label: 'Instrumentos' },
];

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Deep dark cinematic background */}
      <div className="absolute inset-0 bg-[hsl(222,47%,5%)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(222,47%,5%)]/30 to-[hsl(222,47%,5%)]" />
      </div>

      {/* 3D Audio Visualizer */}
      <AudioVisualizer3D />

      {/* Cinematic overlay gradients */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[hsl(222,47%,5%)]/80 via-transparent to-[hsl(222,47%,5%)]/60" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[hsl(222,47%,5%)] via-transparent to-transparent" />

      {/* Lens flare effect */}
      <div className="absolute top-1/3 right-1/3 w-[600px] h-[600px] z-[1] opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle,hsla(239,84%,67%,0.3)_0%,transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="container relative mx-auto px-4 pt-32 pb-20 z-[2]">
        <div className="max-w-3xl">
          {/* Tag */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-sm font-medium text-white/90">
              Más de 10,000 estudiantes activos
            </span>
          </motion.div>

          {/* Heading with stagger */}
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight"
          >
            Aprende música online con{' '}
            <span className="relative">
              <span className="gradient-text">clases reales en vivo</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full gradient-bg"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ transformOrigin: 'left' }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl leading-relaxed"
          >
            Clases de guitarra, piano, batería y banjo con profesores profesionales. 
            Desde principiante hasta avanzado, a tu ritmo.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 mb-14"
          >
            <a href="#precios">
              <Button variant="hero" size="xl" className="group">
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Comenzar Ahora
              </Button>
            </a>
            <Link to="/auth">
              <Button variant="heroOutline" size="xl">
                Acceder a Clases
              </Button>
            </Link>
          </motion.div>

          {/* Badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-wrap gap-3"
          >
            {badges.map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-white/70">{badge.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center md:text-left">
              <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-white/40 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[2]"
      >
        <span className="text-xs text-white/30 uppercase tracking-[0.3em]">Descubrir</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
