import { useState } from 'react';
import { Plus, Trash2, Video, Users, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminLiveClasses, useDeleteLiveClass } from '@/hooks/useAdminData';
import { LiveClassForm } from './LiveClassForm';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

const instrumentEmojis: Record<string, string> = {
  guitar: '🎸',
  piano: '🎹',
  drums: '🥁',
};

export const LiveClassesTable = () => {
  const { data: classes = [], isLoading } = useAdminLiveClasses();
  const deleteLiveClass = useDeleteLiveClass();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLiveClass.mutateAsync(deleteId);
      toast({ title: 'Clase eliminada exitosamente' });
    } catch (error) {
      toast({ title: 'Error al eliminar la clase', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Clases en Vivo
          </CardTitle>
          <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Nueva Clase
          </Button>
        </CardHeader>
        <CardContent>
          <div className="md:hidden space-y-3">
            {classes.map((cls) => {
              const scheduledDate = new Date(cls.scheduled_at);
              const isUpcoming = isFuture(scheduledDate);
              const isPassed = isPast(scheduledDate);

              return (
                <div key={cls.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cls.instrument ? instrumentEmojis[cls.instrument] : '🎵'}</span>
                        <p className="font-medium text-foreground leading-tight truncate">{cls.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{cls.description}</p>
                    </div>
                    {isUpcoming ? (
                      <Badge className="bg-secondary/20 text-secondary shrink-0">Próxima</Badge>
                    ) : isPassed ? (
                      <Badge variant="secondary" className="shrink-0">Finalizada</Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-600 shrink-0">En curso</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(scheduledDate, "d MMM yyyy", { locale: es })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(scheduledDate, 'HH:mm')} · {cls.duration_minutes} min</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{cls.live_class_registrations?.length || 0}/{cls.max_attendees}</span>
                    <Badge variant="outline" className="w-fit capitalize">{cls.required_plan}</Badge>
                  </div>

                  <Button variant="outline" size="sm" className="w-full text-destructive" onClick={() => setDeleteId(cls.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              );
            })}
            {classes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay clases programadas. Crea tu primera clase en vivo.
              </div>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clase</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Instrumento</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inscritos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((cls) => {
                const scheduledDate = new Date(cls.scheduled_at);
                const isUpcoming = isFuture(scheduledDate);
                const isPassed = isPast(scheduledDate);

                return (
                  <TableRow key={cls.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{cls.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {cls.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(scheduledDate, "d 'de' MMMM, yyyy", { locale: es })}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {format(scheduledDate, 'HH:mm')} - {cls.duration_minutes} min
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xl">
                        {cls.instrument ? instrumentEmojis[cls.instrument] : '🎵'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {cls.required_plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{cls.live_class_registrations?.length || 0}</span>
                        <span className="text-muted-foreground">/ {cls.max_attendees}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isUpcoming ? (
                        <Badge className="bg-secondary/20 text-secondary">Próxima</Badge>
                      ) : isPassed ? (
                        <Badge variant="secondary">Finalizada</Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-600">En curso</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setDeleteId(cls.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay clases programadas. Crea tu primera clase en vivo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LiveClassForm open={showForm} onClose={() => setShowForm(false)} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar clase?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todas las inscripciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
