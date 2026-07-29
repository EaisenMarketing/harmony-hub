import { Users, Phone, Crown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMyStudents, useInstructorProfile } from '@/hooks/useInstructorData';
import { StudentBriefingModal } from './StudentBriefingModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const planColors: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  standard: 'bg-primary/20 text-primary',
  pro: 'bg-amber-500/20 text-amber-600',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-600',
  inactive: 'bg-muted text-muted-foreground',
  completed: 'bg-primary/20 text-primary',
};

const statusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  completed: 'Completado',
};

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra',
  piano: 'Piano',
  drums: 'Batería',
};

export const InstructorStudents = () => {
  const { data: profile } = useInstructorProfile();
  const { data: students = [], isLoading } = useMyStudents();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'AL';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  const activeStudents = students.filter((s) => s.status === 'active');
  const inactiveStudents = students.filter((s) => s.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{students.length}</p>
            <p className="text-sm text-muted-foreground">Total Alumnos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-500">{activeStudents.length}</p>
            <p className="text-sm text-muted-foreground">Activos</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-muted-foreground">{inactiveStudents.length}</p>
            <p className="text-sm text-muted-foreground">Inactivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Mis Alumnos de {instrumentLabels[profile?.instrument || 'guitar']}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tienes alumnos asignados aún</p>
              <p className="text-sm mt-1">Los alumnos aparecerán aquí cuando se inscriban en tus cursos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Inscripción</TableHead>
                  <TableHead className="text-right">Briefing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={student.student?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(student.student?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.student?.full_name || 'Sin nombre'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        {student.student?.phone || 'Sin teléfono'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${planColors[student.student?.subscription_plan || 'basic']} gap-1`}>
                        {student.student?.subscription_plan === 'pro' && <Crown className="w-3 h-3" />}
                        {student.student?.subscription_plan?.toUpperCase() || 'BASIC'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[student.status]}>
                        {statusLabels[student.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(student.enrolled_at), "d MMM yyyy", { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <StudentBriefingModal
                        studentId={student.student_id}
                        studentName={student.student?.full_name || 'Alumno'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
