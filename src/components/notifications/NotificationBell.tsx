import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications,
  useMarkNotificationsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';

export const NotificationBell = ({ className }: { className?: string }) => {
  const { data: items = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const remove = useDeleteNotification();
  const navigate = useNavigate();

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative ${className ?? ''}`} aria-label="Notificaciones">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 bg-card border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <p className="text-sm font-semibold text-foreground">Notificaciones</p>
          {unread > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => markRead.mutate(undefined)}
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar leídas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              No tienes notificaciones todavía.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 flex items-start gap-2 ${n.read_at ? '' : 'bg-primary/5'}`}
                >
                  <button
                    className="text-left min-w-0 flex-1"
                    onClick={() => {
                      if (!n.read_at) markRead.mutate([n.id]);
                      if (n.link) navigate(n.link);
                    }}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{n.body}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground shrink-0"
                    onClick={() => remove.mutate(n.id)}
                    aria-label="Eliminar notificación"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
