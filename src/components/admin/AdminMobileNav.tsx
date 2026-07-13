import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BookOpen,
  Film,
  Headphones,
  Video,
  BarChart3,
  Settings,
  MoreHorizontal,
  LogOut,
  Home,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const primary = [
  { name: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { name: 'Cursos', href: '/admin/cursos', icon: BookOpen },
  { name: 'Clases', href: '/admin/clases', icon: Video },
  { name: 'Alumnos', href: '/admin/estudiantes', icon: Users },
];

const more = [
  { name: 'Instructores', href: '/admin/instructores', icon: Users },
  { name: 'Aplicaciones', href: '/admin/aplicaciones', icon: ClipboardList },
  { name: 'Biblioteca de Videos', href: '/admin/videos', icon: Film },
  { name: 'Producción Musical', href: '/admin/produccion', icon: Headphones },
  { name: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

export const AdminMobileNav = () => {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const isMoreActive = more.some((i) => pathname.startsWith(i.href));

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-premium-dark/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {primary.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5',
                    isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary))]'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'w-full flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  isMoreActive ? 'text-primary' : 'text-white/60 hover:text-white'
                )}
              >
                <MoreHorizontal
                  className={cn(
                    'w-5 h-5',
                    isMoreActive && 'drop-shadow-[0_0_6px_hsl(var(--primary))]'
                  )}
                />
                <span>Más</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="bg-premium-dark border-white/10 text-white rounded-t-2xl max-h-[85vh]"
            >
              <SheetHeader>
                <SheetTitle className="text-white text-left">Más opciones</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {more.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-colors',
                        isActive
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/10'
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-[11px] leading-tight font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  to="/portal"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80 hover:bg-white/10"
                >
                  <Home className="w-4 h-4" /> Portal
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive hover:bg-destructive/20"
                >
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
};
