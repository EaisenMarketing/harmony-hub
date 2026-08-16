import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Award, 
  Settings, 
  CreditCard,
  LogOut,
  Shield,
  GraduationCap,
  Headphones,
  Music,
  MessageCircleQuestion,
  Users,
  TrendingUp,
  FileMusic
} from 'lucide-react';
import logo from '@/assets/logo.webp';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useIsAdmin } from '@/hooks/useAdminData';
import { useIsInstructor, useInstructorProfile } from '@/hooks/useInstructorData';
import { useUserInstrument } from '@/hooks/useUserInstrument';

const baseNavigation = [
  { name: 'Dashboard', href: '/portal', icon: LayoutDashboard },
  { name: 'Mis Cursos', href: '/portal/cursos', icon: BookOpen },
  { name: 'Mi Progreso', href: '/portal/progreso', icon: TrendingUp },
  { name: 'Sala de Práctica', href: '/portal/practica', icon: Music },
  { name: 'Creador de Partituras', href: '/portal/partituras', icon: FileMusic },
  { name: 'Pregunta al Maestro', href: '/portal/consultas', icon: MessageCircleQuestion },
  { name: 'Comunidad', href: '/portal/comunidad', icon: Users },
  { name: 'Calendario', href: '/portal/calendario', icon: Calendar },
  { name: 'Certificados', href: '/portal/certificados', icon: Award },
  { name: 'Pagos', href: '/portal/pagos', icon: CreditCard },
  { name: 'Configuración', href: '/portal/configuracion', icon: Settings },
];


export const StudentSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: profile } = useStudentProfile();
  const { data: isAdmin } = useIsAdmin();
  const { data: isInstructor } = useIsInstructor();
  const { data: instructorProfile } = useInstructorProfile();
  const { data: userIns } = useUserInstrument();

  const navigation = [
    ...baseNavigation.slice(0, 3),
    ...(userIns?.instrument === 'production'
      ? [{ name: 'Producción', href: '/portal/produccion', icon: Headphones }]
      : []),
    ...baseNavigation.slice(3),
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show instructor link if user is instructor or has a pending request
  const showInstructorLink = isInstructor || instructorProfile;


  return (
    <aside className="hidden md:flex w-64 bg-card border-r border-border h-screen sticky top-0 flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <img loading="lazy" decoding="async" src={logo} alt="Acorde Live" className="w-10 h-10 rounded-xl object-cover" />
          <span className="font-bold text-lg text-foreground">Acorde Live</span>
        </Link>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(profile?.full_name || user?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {profile?.full_name || 'Estudiante'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userIns?.instrument ? `Plan ${userIns.instrument}` : 'Sin instrumento'}
            </p>

          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Instructor Link */}
      {showInstructorLink && (
        <div className="p-3 border-t border-border">
          <Link to="/instructor">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-secondary hover:text-secondary hover:bg-secondary/10"
            >
              <GraduationCap className="w-5 h-5" />
              {instructorProfile?.status === 'pending' ? 'Solicitud Pendiente' : 'Panel Instructor'}
            </Button>
          </Link>
        </div>
      )}

      {/* Admin Link */}
      {isAdmin && (
        <div className="p-3 border-t border-border">
          <Link to="/admin">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Shield className="w-5 h-5" />
              Panel Admin
            </Button>
          </Link>
        </div>
      )}

      {/* Become Instructor Link - show only if not already an instructor */}
      {!showInstructorLink && (
        <div className="p-3 border-t border-border">
          <Link to="/instructor">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <GraduationCap className="w-5 h-5" />
              Ser Instructor
            </Button>
          </Link>
        </div>
      )}

      {/* Sign Out */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};
