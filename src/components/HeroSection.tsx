import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Video, Clock, Award, CheckCircle2 } from 'lucide-react';
import heroImage from '@/assets/hero-musician.jpg';

const badges = [
  { icon: Video, text: 'Clases en vivo por Zoom' },
  { icon: Clock, text: 'Acceso 24/7' },
  { icon: Award, text: 'Certificados oficiales' },
];

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-premium-dark">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-premium-dark via-premium-dark/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-premium-dark via-transparent to-premium-dark/50" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="container relative mx-auto px-4 pt-32 pb-20">
        <div className="max-w-3xl">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-white/90">
              Más de 10,000 estudiantes activos
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Aprende música online con{' '}
            <span className="gradient-text">clases reales en vivo</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Clases de guitarra, piano, batería y banjo con profesores profesionales. 
            Desde principiante hasta avanzado, a tu ritmo.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <a href="#precios">
              <Button variant="hero" size="xl">
                Ver Planes
              </Button>
            </a>
            <Link to="/auth">
              <Button variant="heroOutline" size="xl">
                Acceder a Clases
              </Button>
            </Link>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {badges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-white/80">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-white/50 uppercase tracking-widest">Scroll</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
