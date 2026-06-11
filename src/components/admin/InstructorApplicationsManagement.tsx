import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Eye, Mail, Phone, Video, Clock, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  instrument: string;
  years_experience: number;
  bio: string;
  presentation_video_url: string | null;
  sample_class_url: string | null;
  availability: string | null;
  timezone: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

const statusBadge = (status: Application['status']) => {
  if (status === 'approved') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Aprobada</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rechazada</Badge>;
  return <Badge variant="outline">Pendiente</Badge>;
};

export const InstructorApplicationsManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Application | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['instructor-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Application[];
    },
  });

  const approve = useMutation({
    mutationFn: async (applicationId: string) => {
      const { data, error } = await supabase.functions.invoke('approve-instructor-application', {
        body: { applicationId },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error');
      return data as { tempPassword: string | null; alreadyExisted: boolean };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['instructor-applications'] });
      setTempPassword(data.tempPassword);
      toast({
        title: 'Maestro aprobado',
        description: data.alreadyExisted
          ? 'El usuario ya existía, se le asignó el rol de instructor.'
          : 'Cuenta creada. Comparte la contraseña temporal con el maestro.',
      });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const reject = useMutation({
    mutationFn: async (applicationId: string) => {
      const { error } = await supabase
        .from('instructor_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .eq('id', applicationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-applications'] });
      toast({ title: 'Aplicación rechazada' });
      setSelected(null);
    },
  });

  const pending = applications.filter((a) => a.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Aplicaciones de Maestros</h2>
        <p className="text-muted-foreground text-sm">
          Revisa y aprueba a los maestros que aplican desde <code>/aplicar-maestro</code>.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold">{pending.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{applications.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Aprobadas</p>
          <p className="text-2xl font-bold">{applications.filter((a) => a.status === 'approved').length}</p>
        </CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : applications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No hay aplicaciones aún. Comparte el enlace <code>/aplicar-maestro</code> para empezar a recibir solicitudes.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {applications.map((app) => (
            <Card key={app.id} className="hover:border-primary/50 transition">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base">{app.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-3 flex-wrap mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                      <span>•</span>
                      <span>{app.instrument}</span>
                      <span>•</span>
                      <span>{app.years_experience} años</span>
                    </CardDescription>
                  </div>
                  {statusBadge(app.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setSelected(app)}>
                  <Eye className="w-4 h-4 mr-1" /> Ver detalle
                </Button>
                {app.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approve.mutate(app.id)}
                      disabled={approve.isPending}
                    >
                      {approve.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => reject.mutate(app.id)}
                      disabled={reject.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setTempPassword(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.full_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{selected.email}</div>
                {selected.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{selected.phone}</div>}
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />{selected.timezone}</div>

                <div>
                  <p className="font-medium mb-1">Biografía</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selected.bio}</p>
                </div>

                {selected.availability && (
                  <div>
                    <p className="font-medium mb-1">Disponibilidad</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selected.availability}</p>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  {selected.presentation_video_url && (
                    <a href={selected.presentation_video_url} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Video className="w-4 h-4" /> Video presentación
                    </a>
                  )}
                  {selected.sample_class_url && (
                    <a href={selected.sample_class_url} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Video className="w-4 h-4" /> Clase muestra
                    </a>
                  )}
                </div>

                {tempPassword && (
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 space-y-2">
                    <p className="font-medium text-sm">Contraseña temporal generada:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-background px-2 py-1 rounded text-sm flex-1">{tempPassword}</code>
                      <Button size="sm" variant="outline" onClick={() => {
                        navigator.clipboard.writeText(tempPassword);
                        toast({ title: 'Copiado' });
                      }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Comparte este password con el maestro por un medio seguro. Debe cambiarlo al ingresar.
                    </p>
                  </div>
                )}

                {selected.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button onClick={() => approve.mutate(selected.id)} disabled={approve.isPending}>
                      {approve.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                      Aprobar
                    </Button>
                    <Button variant="destructive" onClick={() => reject.mutate(selected.id)} disabled={reject.isPending}>
                      <XCircle className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
