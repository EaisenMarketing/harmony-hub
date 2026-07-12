import { useState } from 'react';
import { Users, CheckCircle, XCircle, Clock, Music, Guitar, Piano, Drum } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllInstructors, useUpdateInstructorStatus, InstructorProfile } from '@/hooks/useInstructorData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const instrumentIcons: Record<string, React.ReactNode> = {
  guitar: <Guitar className="w-4 h-4" />,
  piano: <Piano className="w-4 h-4" />,
  drums: <Drum className="w-4 h-4" />,
};

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-600',
  approved: 'bg-emerald-500/20 text-emerald-600',
  rejected: 'bg-destructive/20 text-destructive',
  suspended: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  suspended: 'Suspendido',
};

export const InstructorsManagement = () => {
  const { data: instructors = [], isLoading } = useAllInstructors();
  const updateStatus = useUpdateInstructorStatus();
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorProfile | null>(null);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'suspend' | null>(null);

  const pendingInstructors = instructors.filter((i) => i.status === 'pending');
  const approvedInstructors = instructors.filter((i) => i.status === 'approved');
  const otherInstructors = instructors.filter((i) => 
    i.status === 'rejected' || i.status === 'suspended'
  );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'IN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAction = async (action: 'approved' | 'rejected' | 'suspended') => {
    if (!selectedInstructor) return;

    try {
      await updateStatus.mutateAsync({
        id: selectedInstructor.id,
        status: action,
      });
      toast.success(
        action === 'approved' 
          ? 'Instructor aprobado exitosamente' 
          : action === 'rejected'
          ? 'Solicitud rechazada'
          : 'Instructor suspendido'
      );
      setConfirmAction(null);
      setSelectedInstructor(null);
    } catch {
      toast.error('Error al actualizar el estado');
    }
  };

  const InstructorRow = ({ instructor }: { instructor: InstructorProfile }) => (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={instructor.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials(instructor.profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{instructor.profile?.full_name || 'Sin nombre'}</p>
            <p className="text-sm text-muted-foreground">{instructor.profile?.phone || 'Sin teléfono'}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="gap-1">
          {instrumentIcons[instructor.instrument]}
          {instrumentLabels[instructor.instrument]}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={statusColors[instructor.status]}>
          {statusLabels[instructor.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {instructor.years_experience} años
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(instructor.created_at), "d MMM yyyy", { locale: es })}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {instructor.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                onClick={() => {
                  setSelectedInstructor(instructor);
                  setConfirmAction('approve');
                }}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setSelectedInstructor(instructor);
                  setConfirmAction('reject');
                }}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rechazar
              </Button>
            </>
          )}
          {instructor.status === 'approved' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedInstructor(instructor);
                setConfirmAction('suspend');
              }}
            >
              Suspender
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Gestión de Instructores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Pendientes ({pendingInstructors.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Aprobados ({approvedInstructors.length})
              </TabsTrigger>
              <TabsTrigger value="other">
                Otros ({otherInstructors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingInstructors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay solicitudes pendientes
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Instrumento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Experiencia</TableHead>
                      <TableHead>Solicitud</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInstructors.map((instructor) => (
                      <InstructorRow key={instructor.id} instructor={instructor} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedInstructors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay instructores aprobados
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Instrumento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Experiencia</TableHead>
                      <TableHead>Aprobado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedInstructors.map((instructor) => (
                      <InstructorRow key={instructor.id} instructor={instructor} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="other">
              {otherInstructors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay instructores rechazados o suspendidos
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Instrumento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Experiencia</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherInstructors.map((instructor) => (
                      <InstructorRow key={instructor.id} instructor={instructor} />
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === 'approve' && 'Aprobar Instructor'}
              {confirmAction === 'reject' && 'Rechazar Solicitud'}
              {confirmAction === 'suspend' && 'Suspender Instructor'}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === 'approve' && (
                <>
                  ¿Estás seguro de aprobar a <strong>{selectedInstructor?.profile?.full_name}</strong> como 
                  instructor de <strong>{instrumentLabels[selectedInstructor?.instrument || '']}</strong>?
                  Esto le dará acceso al panel de instructor.
                </>
              )}
              {confirmAction === 'reject' && (
                <>
                  ¿Estás seguro de rechazar la solicitud de <strong>{selectedInstructor?.profile?.full_name}</strong>?
                </>
              )}
              {confirmAction === 'suspend' && (
                <>
                  ¿Estás seguro de suspender a <strong>{selectedInstructor?.profile?.full_name}</strong>?
                  No podrá acceder al panel de instructor.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmAction === 'approve' ? 'default' : 'destructive'}
              onClick={() => {
                if (confirmAction === 'approve') handleAction('approved');
                if (confirmAction === 'reject') handleAction('rejected');
                if (confirmAction === 'suspend') handleAction('suspended');
              }}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Procesando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
