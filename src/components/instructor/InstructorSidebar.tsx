import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Video, 
  LogOut,
  Home,
  MessageCircleQuestion,
} from 'lucide-react';
import logo from '@/assets/logo.webp';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInstructorProfile } from '@/hooks/useInstructorData';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navigation = [
  { name: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
  { name: 'Mis Alumnos', href: '/instructor/alumnos', icon: Users },
  { name: 'Mis Cursos', href: '/instructor/cursos', icon: BookOpen },
  { name: 'Mis Clases', href: '/instructor/clases', icon: Video },
  { name: 'Consultas', href: '/instructor/consultas', icon: MessageCircleQuestion },
];

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
};

export const InstructorSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useInstructorProfile();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'IN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-64 bg-premium-dark border-r border-white/10 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link to="/instructor" className="flex items-center gap-2">
          <img loading="lazy" decoding="async" src={logo} alt="Acorde Live" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <span className="font-bold text-lg text-white">Instructor</span>
            <p className="text-xs text-white/60">
              {instrumentLabels[profile?.instrument || 'guitar']}
            </p>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials(user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.email}
            </p>
            <p className="text-xs text-white/60">
              {profile?.specialization || 'Instructor'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/instructor' && location.pathname.startsWith(item.href));
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
            <Home className="w-5 h-5" />
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
