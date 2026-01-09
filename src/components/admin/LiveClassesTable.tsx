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
  banjo: '🪕',
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
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Clases en Vivo
          </CardTitle>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nueva Clase
          </Button>
        </CardHeader>
        <CardContent>
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
