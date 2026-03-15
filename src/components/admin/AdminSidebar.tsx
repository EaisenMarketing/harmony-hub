import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  Users, 
  Settings,
  LogOut,
  BarChart3,
  Film
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Instructores', href: '/admin/instructores', icon: Users },
  { name: 'Cursos', href: '/admin/cursos', icon: BookOpen },
  { name: 'Biblioteca Videos', href: '/admin/videos', icon: Film },
  { name: 'Clases en Vivo', href: '/admin/clases', icon: Video },
  { name: 'Estudiantes', href: '/admin/estudiantes', icon: Users },
  { name: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="w-64 bg-premium-dark border-r border-white/10 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Acorde Live" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <span className="font-bold text-lg text-white">Admin</span>
            <p className="text-xs text-white/60">Panel de Control</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/admin' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <Link to="/portal">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Users className="w-5 h-5" />
            Portal Alumno
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/10"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};
