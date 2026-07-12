import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  author_name: string;
  role_or_instrument: string | null;
  quote: string;
  avatar_url: string | null;
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('id, author_name, role_or_instrument, quote, avatar_url')
      .eq('is_approved', true)
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data }) => setTestimonials(data ?? []));
  }, []);

  // Si no hay testimonios aprobados aún, no rendereamos la sección.
  if (testimonials.length === 0) return null;

  return (
    <section id="testimonios" className="py-24 bg-[hsl(222,47%,6%)] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
              Testimonios
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Lo que dicen nuestros{' '}
              <span className="gradient-text">estudiantes</span>
            </h2>
            <p className="text-lg text-white/50">
              Historias reales de estudiantes de Acorde Live.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, index) => (
            <ScrollReveal key={t.id} delay={index * 0.15}>
              <div className="relative bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 hover:border-primary/20 transition-all duration-300">
                <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                  <Quote className="w-5 h-5 text-white" />
                </div>
                <div className="flex gap-1 mb-4">
                  {[0,1,2,3,4].map(i => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  {t.avatar_url && (
                    <img loading="lazy" decoding="async"
                      src={t.avatar_url}
                      alt={t.author_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-white">{t.author_name}</h4>
                    {t.role_or_instrument && (
                      <p className="text-sm text-white/40">{t.role_or_instrument}</p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
