import { Star, Quote } from 'lucide-react';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Alejandro Ramírez',
    instrument: 'Guitarra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'Después de años intentando aprender solo, finalmente encontré una escuela que entiende cómo enseñar. Las clases en vivo son increíbles y el feedback personalizado me ayudó a mejorar rápidamente.',
  },
  {
    name: 'Laura Mendoza',
    instrument: 'Piano',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'La calidad de los cursos es excepcional. Los profesores son muy profesionales y el material descargable es muy completo. Ahora toco piezas que nunca pensé poder tocar.',
  },
  {
    name: 'Miguel Torres',
    instrument: 'Producción Musical',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'El curso de producción musical cambió mi carrera. Aprendí mezcla, mastering y diseño sonoro con profesionales de la industria. El plan Pro realmente vale cada centavo.',
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="py-24 bg-[hsl(222,47%,6%)] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>
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
              Miles de músicos ya transformaron su forma de aprender con nosotros.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <ScrollReveal key={index} delay={index * 0.15}>
              <motion.div
                whileHover={{ y: -6 }}
                className="relative bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 hover:border-primary/20 transition-all duration-300"
              >
                <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                  <Quote className="w-5 h-5 text-white" />
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-white/70 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-4">
                  <img loading="lazy" decoding="async"
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <h4 className="font-semibold text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-white/40">
                      Estudiante de {testimonial.instrument}
                    </p>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
