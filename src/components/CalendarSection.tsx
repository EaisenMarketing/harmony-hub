import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    title: 'Piano: Lectura de Partituras',
    instructor: 'Ana López',
    date: 'Jue 18 Ene',
    time: '5:00 PM',
    timezone: 'CDMX',
    level: 'Intermedio',
    spots: 10,
  },
];

export function CalendarSection() {
  return (
    <section id="calendario" className="py-24 bg-muted/50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Clases en Vivo
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Próximas clases{' '}
            <span className="gradient-text">por Zoom</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Interactúa en tiempo real con instructores profesionales. Las grabaciones quedan disponibles después de cada sesión.
          </p>
        </div>

        {/* Features Row */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Video className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Zoom integrado</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Conversión de zona horaria</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Recordatorios automáticos</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {upcomingClasses.map((classItem, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary mb-2">
                    {classItem.level}
                  </span>
                  <h3 className="text-lg font-bold text-card-foreground">
                    {classItem.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    con {classItem.instructor}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium">{classItem.spots} lugares</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{classItem.date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{classItem.time} ({classItem.timezone})</span>
                </div>
              </div>

              <Link to="/auth">
                <Button variant="outline" size="sm" className="w-full opacity-0 group-hover:opacity-100 transition-opacity">
                  Reservar lugar
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/auth">
            <Button variant="gradient" size="lg">
              Ver calendario completo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
