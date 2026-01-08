import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: '¿Necesito experiencia previa para tomar los cursos?',
    answer: 'No, tenemos cursos diseñados para todos los niveles. Nuestro programa de nivel básico está pensado para principiantes absolutos, donde aprenderás desde cómo sostener tu instrumento hasta tocar tus primeras canciones. Los instructores te guiarán paso a paso.',
  },
  {
    question: '¿Las clases en vivo quedan grabadas?',
    answer: 'Sí, todas las clases en vivo por Zoom quedan grabadas y disponibles en tu cuenta dentro de las 24 horas siguientes. Podrás verlas las veces que quieras durante tu suscripción activa.',
  },
  {
    question: '¿Puedo cancelar mi suscripción cuando quiera?',
    answer: 'Absolutamente. No hay contratos ni compromisos a largo plazo. Puedes cancelar tu suscripción en cualquier momento desde tu panel de cuenta. Mantendrás acceso hasta el final de tu período de facturación.',
  },
  {
    question: '¿En qué horarios son las clases en vivo?',
    answer: 'Las clases en vivo se programan en diferentes horarios para acomodar distintas zonas horarias. La mayoría son por las tardes (hora de Ciudad de México). El calendario muestra automáticamente los horarios convertidos a tu zona horaria local.',
  },
  {
    question: '¿Recibo certificado al completar un curso?',
    answer: 'Sí, los suscriptores del Plan Pro reciben certificados oficiales de finalización por cada curso completado. Estos certificados son digitales y puedes compartirlos en redes sociales o incluirlos en tu currículum.',
  },
  {
    question: '¿Qué materiales están incluidos?',
    answer: 'Dependiendo de tu plan, puedes acceder a partituras en PDF, backing tracks, archivos Guitar Pro, ejercicios descargables y material complementario. El Plan Pro incluye acceso completo a todos los materiales.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-muted/30 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Preguntas{' '}
            <span className="gradient-text">frecuentes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Encuentra respuestas a las dudas más comunes sobre nuestra plataforma.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
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
