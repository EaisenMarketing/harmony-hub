import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Music,
  FileMusic,
  MessageCircleQuestion,
  Headphones,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserInstrument } from '@/hooks/useUserInstrument';

export const MobileBottomNav = () => {
  const location = useLocation();
  const { data: userIns } = useUserInstrument();
  const isProduction = userIns?.instrument === 'production';

  const tabs = [
    { name: 'Inicio', href: '/portal', icon: LayoutDashboard },
    { name: 'Cursos', href: '/portal/cursos', icon: BookOpen },
    ...(isProduction
      ? [{ name: 'Producción', href: '/portal/produccion', icon: Headphones }]
      : [{ name: 'Práctica', href: '/portal/practica', icon: Music }]),
    { name: 'Partituras', href: '/portal/partituras', icon: FileMusic },
    { name: 'Maestros', href: '/portal/consultas', icon: MessageCircleQuestion },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const isActive = tab.href === '/portal'
            ? location.pathname === '/portal'
            : location.pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.name}
              to={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-colors min-w-0',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <tab.icon className={cn('w-5 h-5 shrink-0', isActive && 'drop-shadow-sm')} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={cn(
                'text-[10px] leading-tight truncate',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
