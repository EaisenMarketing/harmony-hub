import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  MessageCircleQuestion,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { name: 'Inicio', href: '/instructor', icon: LayoutDashboard },
  { name: 'Alumnos', href: '/instructor/alumnos', icon: Users },
  { name: 'Cursos', href: '/instructor/cursos', icon: BookOpen },
  { name: 'Clases', href: '/instructor/clases', icon: Video },
  { name: 'Consultas', href: '/instructor/consultas', icon: MessageCircleQuestion },
];

export const InstructorMobileNav = () => {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-premium-dark/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/instructor' && pathname.startsWith(item.href));
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
      </ul>
    </nav>
  );
};
