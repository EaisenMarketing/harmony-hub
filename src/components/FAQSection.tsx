import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollReveal } from '@/components/landing/ScrollReveal';

const faqs = [
  {
    question: '¿Necesito experiencia previa para tomar los cursos?',
    answer: 'No, tenemos cursos diseñados para todos los niveles. Nuestro programa de nivel básico está pensado para principiantes absolutos, donde aprenderás desde cómo sostener tu instrumento hasta tocar tus primeras canciones.',
  },
  {
    question: '¿Las clases en vivo quedan grabadas?',
    answer: 'Sí, todas las clases en vivo por Zoom quedan grabadas y disponibles en tu cuenta dentro de las 24 horas siguientes. Podrás verlas las veces que quieras durante tu suscripción activa.',
  },
  {
    question: '¿Puedo cancelar mi suscripción cuando quiera?',
    answer: 'Absolutamente. No hay contratos ni compromisos a largo plazo. Puedes cancelar tu suscripción en cualquier momento desde tu panel de cuenta.',
  },
  {
    question: '¿En qué horarios son las clases en vivo?',
    answer: 'Las clases en vivo se programan en diferentes horarios para acomodar distintas zonas horarias. La mayoría son por las tardes (hora de Ciudad de México). El calendario muestra automáticamente los horarios convertidos a tu zona horaria local.',
  },
  {
    question: '¿Recibo certificado al completar un curso?',
    answer: 'Sí, los suscriptores del Plan Pro reciben certificados oficiales de finalización por cada curso completado. Estos certificados son digitales y puedes compartirlos en redes sociales.',
  },
  {
    question: '¿Qué incluye el curso de Producción Musical?',
    answer: 'El curso de producción musical cubre mezcla, mastering, diseño sonoro, uso de DAWs profesionales, grabación y post-producción. Incluye proyectos prácticos y feedback de productores de la industria.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-[hsl(222,47%,7%)] relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
              FAQ
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Preguntas{' '}
              <span className="gradient-text">frecuentes</span>
            </h2>
            <p className="text-lg text-white/50">
              Encuentra respuestas a las dudas más comunes sobre nuestra plataforma.
            </p>
          </div>
        </ScrollReveal>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white/[0.03] rounded-xl border border-white/[0.06] px-6 data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5 text-white/90">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/50 pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
