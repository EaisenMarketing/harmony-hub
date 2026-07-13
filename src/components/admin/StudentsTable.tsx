import { Users, Mail, Calendar, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminStudents } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const planColors: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  standard: 'bg-primary/20 text-primary',
  pro: 'bg-amber-500/20 text-amber-600',
};

export const StudentsTable = () => {
  const { data: students = [], isLoading } = useAdminStudents();

  const getInitials = (name: string) => {
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

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Estudiantes ({students.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="md:hidden space-y-3">
          {students.map((student) => (
            <div key={student.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={student.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(student.full_name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{student.full_name || 'Sin nombre'}</p>
                  <p className="text-sm text-muted-foreground truncate">{student.phone || 'Sin teléfono'}</p>
                </div>
                <Badge className={`${planColors[student.subscription_plan || 'basic']} gap-1 shrink-0`}>
                  {student.subscription_plan === 'pro' && <Crown className="w-3 h-3" />}
                  {student.subscription_plan?.toUpperCase() || 'BASIC'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-background/70 p-2">
                  <p className="text-muted-foreground">Estado</p>
                  <p className="font-medium">{student.subscription_status === 'active' ? 'Activo' : 'Inactivo'}</p>
                </div>
                <div className="rounded-md bg-background/70 p-2">
                  <p className="text-muted-foreground">Registro</p>
                  <p className="font-medium">{format(new Date(student.created_at), "d MMM yyyy", { locale: es })}</p>
                </div>
              </div>
            </div>
          ))}
          {students.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay estudiantes registrados.
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Última Actividad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(student.full_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.full_name || 'Sin nombre'}</p>
                      <p className="text-sm text-muted-foreground">{student.phone || 'Sin teléfono'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${planColors[student.subscription_plan || 'basic']} gap-1`}>
                    {student.subscription_plan === 'pro' && <Crown className="w-3 h-3" />}
                    {student.subscription_plan?.toUpperCase() || 'BASIC'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={student.subscription_status === 'active' ? 'default' : 'secondary'}
                    className={student.subscription_status === 'active' ? 'bg-secondary/20 text-secondary' : ''}
                  >
                    {student.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(student.created_at), "d MMM yyyy", { locale: es })}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(student.updated_at), "d MMM yyyy", { locale: es })}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay estudiantes registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
