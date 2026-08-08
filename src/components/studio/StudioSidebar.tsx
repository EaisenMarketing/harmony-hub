import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  Sparkles,
  Video,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const studioNav = [
  { name: 'Inicio', short: 'Inicio', href: '/estudio', icon: LayoutDashboard },
  { name: 'Mis alumnos', short: 'Alumnos', href: '/estudio/alumnos', icon: Users },
  { name: 'Mis cursos', short: 'Cursos', href: '/estudio/cursos', icon: BookOpen },
  { name: 'Clases en vivo', short: 'En vivo', href: '/estudio/clases', icon: Video },
  { name: 'Tareas', short: 'Tareas', href: '/estudio/tareas', icon: ClipboardList },
  { name: 'Avisos', short: 'Avisos', href: '/estudio/avisos', icon: Bell },
  { name: 'Herramientas IA', short: 'IA', href: '/estudio/herramientas', icon: Sparkles },
  { name: 'Configuración', short: 'Ajustes', href: '/estudio/configuracion', icon: Settings },
];

export const isStudioActive = (pathname: string, href: string) =>
  href === '/estudio' ? pathname === '/estudio' : pathname.startsWith(href);

export const StudioSidebar = () => {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r border-white/10 bg-premium-dark/60 backdrop-blur-xl flex flex-col">
      <div className="p-5 border-b border-white/10">
        <p className="text-xs uppercase tracking-widest text-primary/80">Acorde Live</p>
        <h2 className="text-lg font-bold text-white">Mi Estudio</h2>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {studioNav.map((item) => {
          const active = isStudioActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          to="/portal"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5"
        >
          <BookOpen className="w-4 h-4" />
          Ir al portal de alumno
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-white/60 hover:text-white"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
};
