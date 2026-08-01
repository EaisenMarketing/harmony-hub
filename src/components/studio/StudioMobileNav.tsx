import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { studioNav, isStudioActive } from './StudioSidebar';

export const StudioMobileNav = () => {
  const { pathname } = useLocation();
  const items = studioNav.slice(0, 5);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-premium-dark/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isStudioActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-white/60 hover:text-white',
                )}
              >
                <item.icon
                  className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_hsl(var(--primary))]')}
                />
                <span>{item.short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
