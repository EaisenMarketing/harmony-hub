import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/landing/ScrollReveal';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { instrumentLabel } from '@/lib/instruments';
import { formatClassSchedule, SCHOOL_TIMEZONE_LABEL, userTimeZone } from '@/lib/schedule';

interface PublicClass {
  id: string;
  title: string;
  instrument: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  max_attendees: number | null;
}

export function CalendarSection() {
  const [classes, setClasses] = useState<PublicClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('live_classes')
      .select('id,title,instrument,scheduled_at,duration_minutes,max_attendees')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(4)
      .then(({ data }) => {
        if (!mounted) return;
        setClasses((data ?? []) as PublicClass[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
              Los horarios se publican en hora de Estados Unidos ({SCHOOL_TIMEZONE_LABEL}) y se
              convierten automáticamente a tu zona horaria.
            </p>
          </div>
        </ScrollReveal>

        {/* Features Row */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {[
            { icon: Video, text: 'Zoom integrado' },
            { icon: Globe, text: `Tu zona: ${userTimeZone()}` },
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[0, 1].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <ScrollReveal>
            <div className="max-w-2xl mx-auto text-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10">
              <Calendar className="w-10 h-10 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold text-white mb-2">Muy pronto</h3>
              <p className="text-white/50">
                Estamos organizando el calendario de clases en vivo. En cuanto los maestros publiquen
                sus horarios (hora de Estados Unidos), aparecerán aquí convertidos a tu hora local.
              </p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {classes.map((classItem, index) => (
              <ScrollReveal key={classItem.id} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="group bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 hover:border-primary/30 hover:bg-white/[0.05] transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      {classItem.instrument && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary mb-2">
                          {instrumentLabel(classItem.instrument)}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-white">{classItem.title}</h3>
                    </div>
                    {classItem.max_attendees && (
                      <div className="flex items-center gap-1 text-secondary">
                        <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                        <span className="text-xs font-medium">{classItem.max_attendees} lugares</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-white/40">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {formatClassSchedule(classItem.scheduled_at)}
                      {classItem.duration_minutes ? ` · ${classItem.duration_minutes} min` : ''}
                    </span>
                  </div>

                  <Link to="/empezar">
                    <Button variant="outline" size="sm" className="w-full opacity-0 group-hover:opacity-100 transition-opacity border-white/10 text-white/70 hover:text-white hover:bg-white/5">
                      Reservar lugar
                    </Button>
                  </Link>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/clases-en-vivo">
            <Button variant="gradient" size="lg" className="group">
              Ver calendario completo
            </Button>
          </Link>
          <p className="text-sm text-white/40 mt-3">
            Horarios en hora de Estados Unidos, convertidos a tu zona automáticamente
          </p>
        </div>
      </div>
    </section>
  );
}
