import { Link } from 'react-router-dom';
import producerImage from '@/assets/producer-studio.webp';

const badges = [
  'Clases en vivo por Zoom',
  'Acceso 24/7',
  'Certificado digital de finalización',
];

const highlights = [
  { value: '6', label: 'Instrumentos' },
  { value: 'En vivo', label: 'Semanal por Zoom' },
  { value: 'On-demand', label: 'Clases grabadas' },
  { value: 'Maestros', label: 'Profesionales reales' },
];

export function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={producerImage}
          alt="Productor musical en estudio"
          className="w-full h-full object-cover"
          decoding="async"
            width="1920"
            height="1080"
        />
        <div className="absolute inset-0 bg-[hsl(222,47%,5%)]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(222,47%,5%)] via-[hsl(222,47%,5%)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,5%)] via-transparent to-[hsl(222,47%,5%)]/40" />
      </div>

      {/* Subtle glow accents */}
      <div className="absolute top-1/4 right-1/4 hidden h-[360px] w-[360px] rounded-full bg-primary/10 blur-[96px] z-[1] lg:block" />

      {/* Content */}
      <div className="container relative mx-auto px-4 pt-32 pb-20 z-[2]">
        <div className="max-w-3xl">
          {/* Tag */}
          <div 
            className="hero-fade hero-delay-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-sm font-medium text-white/90">
              Formación musical online con maestros reales
            </span>
          </div>

          {/* Heading */}
          <h1 
            className="hero-fade hero-delay-2 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight"
          >
            Aprende música online con{' '}
            <span className="relative">
              <span className="gradient-text">clases reales en vivo</span>
              <span className="hero-line absolute -bottom-2 left-0 right-0 h-1 rounded-full gradient-bg" />
            </span>
          </h1>

          {/* Subtitle */}
          <p 
            className="hero-fade hero-delay-3 text-lg md:text-xl text-white/60 mb-10 max-w-2xl leading-relaxed"
          >
            Guitarra acústica y eléctrica, bajo, batería, piano, trompeta y producción musical.
            Clases en vivo por Zoom, contenido on-demand y maestros profesionales.
          </p>

          {/* CTAs */}
          <div 
            className="hero-fade hero-delay-4 flex flex-col sm:flex-row gap-4 mb-14"
          >
            <Link to="/precios" className="inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-10 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]">
                <span className="mr-2">▶</span>
                Ver planes y comenzar
            </Link>
            <Link to="/cursos">
              <span className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-10 text-lg font-semibold text-white transition-colors hover:bg-white/20">
                Explorar cursos
              </span>
            </Link>
          </div>

          {/* Badges */}
          <div 
            className="hero-fade hero-delay-5 flex flex-wrap gap-3"
          >
            {badges.map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
              >
                <span className="text-secondary">✓</span>
                <span className="text-sm font-medium text-white/70">{badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div
          className="hero-fade hero-delay-6 mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl"
        >
          {highlights.map((h, i) => (
            <div key={i} className="text-center md:text-left">
              <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{h.value}</div>
              <div className="text-sm text-white/40 uppercase tracking-wider">{h.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div 
        className="hero-fade hero-delay-6 absolute bottom-8 left-1/2 -translate-x-1/2 hidden flex-col items-center gap-2 z-[2] sm:flex"
      >
        <span className="text-xs text-white/30 uppercase tracking-[0.3em]">Descubrir</span>
        <div
          className="scroll-dot w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-1 rounded-full bg-white/50" />
        </div>
      </div>
    </section>
  );
}
