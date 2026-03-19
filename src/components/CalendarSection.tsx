import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { motion } from 'framer-motion';

const upcomingClasses = [
  {
    title: 'Guitarra: Acordes de Jazz',
    instructor: 'Carlos Martínez',
    date: 'Lun 15 Ene',
    time: '7:00 PM',
    timezone: 'CDMX',
    level: 'Intermedio',
    spots: 12,
  },
  {
    title: 'Piano: Técnicas de Improvisación',
    instructor: 'María González',
    date: 'Mar 16 Ene',
    time: '6:00 PM',
    timezone: 'CDMX',
    level: 'Avanzado',
    spots: 8,
  },
  {
    title: 'Guitarra: Blues para Principiantes',
    instructor: 'Carlos Martínez',
    date: 'Mié 17 Ene',
    time: '8:00 PM',
    timezone: 'CDMX',
    level: 'Básico',
    spots: 15,
  },
  {
    title: 'Producción: Mezcla y Mastering',
    instructor: 'Diego Ruiz',
    date: 'Jue 18 Ene',
    time: '5:00 PM',
    timezone: 'CDMX',
    level: 'Intermedio',
    spots: 10,
  },
];

export function CalendarSection() {
  return (
    <section id="calendario" className="py-24 bg-[hsl(222,47%,8%)] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 border border-primary/20">
              Clases en Vivo
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Próximas clases{' '}
              <span className="gradient-text">por Zoom</span>
            </h2>
            <p className="text-lg text-white/50">
              Interactúa en tiempo real con instructores profesionales. Las grabaciones quedan disponibles después de cada sesión.
            </p>
          </div>
        </ScrollReveal>

        {/* Features Row */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { icon: Video, text: 'Zoom integrado' },
            { icon: Globe, text: 'Conversión de zona horaria' },
            { icon: Clock, text: 'Recordatorios automáticos' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-white/70">{item.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {upcomingClasses.map((classItem, index) => (
            <ScrollReveal key={index} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="group bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 hover:border-primary/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary mb-2">
                      {classItem.level}
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {classItem.title}
                    </h3>
                    <p className="text-sm text-white/40">
                      con {classItem.instructor}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-secondary">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span className="text-xs font-medium">{classItem.spots} lugares</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-white/40">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{classItem.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{classItem.time} ({classItem.timezone})</span>
                  </div>
                </div>

                <Link to="/auth">
                  <Button variant="outline" size="sm" className="w-full opacity-0 group-hover:opacity-100 transition-opacity border-white/10 text-white/70 hover:text-white hover:bg-white/5">
                    Reservar lugar
                  </Button>
                </Link>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/auth">
            <Button variant="gradient" size="lg" className="group">
              Ver calendario completo
            </Button>
          </Link>
          <p className="text-sm text-white/40 mt-3">
            Inicia sesión para ver todas las clases disponibles
          </p>
        </div>
      </div>
    </section>
  );
}
