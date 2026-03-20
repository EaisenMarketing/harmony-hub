import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Headphones, Plus, Upload, FileText, Trash2, Video } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProductionManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [taskText, setTaskText] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['admin-production-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createClass = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let recordingUrl: string | null = null;

      // Upload video if provided
      if (videoFile) {
        const ext = videoFile.name.split('.').pop();
        const path = `production/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('course-content')
          .upload(path, videoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('course-content')
          .getPublicUrl(path);
        recordingUrl = urlData.publicUrl;
      }

      // Build description with task and PDF info
      let fullDescription = description;
      if (taskText) {
        fullDescription += `\n\n📝 TAREA:\n${taskText}`;
      }
      if (pdfFile) {
        const ext = pdfFile.name.split('.').pop();
        const path = `production/pdfs/${Date.now()}.${ext}`;
        const { error: pdfError } = await supabase.storage
          .from('course-content')
          .upload(path, pdfFile);
        if (pdfError) throw pdfError;
        const { data: pdfUrl } = supabase.storage
          .from('course-content')
          .getPublicUrl(path);
        fullDescription += `\n\n📄 PDF: ${pdfUrl.publicUrl}`;
      }

      const { error } = await supabase.from('live_classes').insert({
        title,
        description: fullDescription,
        scheduled_at: scheduledAt || new Date().toISOString(),
        instructor_id: user?.id,
        recording_url: recordingUrl,
        is_recorded: !!recordingUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-production-classes'] });
      toast({ title: 'Clase creada', description: 'La clase de producción se ha creado correctamente.' });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
    onSettled: () => setUploading(false),
  });

  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('live_classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-production-classes'] });
      toast({ title: 'Eliminada', description: 'Clase eliminada correctamente.' });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScheduledAt('');
    setVideoFile(null);
    setPdfFile(null);
    setTaskText('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Headphones className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Producción Musical</h2>
            <p className="text-sm text-muted-foreground">Gestiona clases, videos, tareas y material</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Clase
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crear Clase de Producción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título de la clase</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Introducción a Ableton Live" />
              </div>
              <div className="space-y-2">
                <Label>Fecha programada</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el contenido de la clase..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Tarea para estudiantes</Label>
              <Textarea value={taskText} onChange={e => setTaskText(e.target.value)} placeholder="Escribe la tarea que deben entregar los estudiantes..." rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Video className="w-4 h-4" /> Video de la clase
                </Label>
                <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Material PDF
                </Label>
                <Input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
              <Button onClick={() => createClass.mutate()} disabled={!title || uploading} className="gap-2">
                <Upload className="w-4 h-4" />
                {uploading ? 'Subiendo...' : 'Crear Clase'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classes Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay clases de producción aún</TableCell>
                </TableRow>
              ) : (
                classes.map(cls => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.title}</TableCell>
                    <TableCell>{format(new Date(cls.scheduled_at), 'dd MMM yyyy, HH:mm', { locale: es })}</TableCell>
                    <TableCell>
                      {cls.recording_url ? (
                        <span className="text-emerald-500 text-sm">✓ Subido</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin video</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {cls.description?.includes('📄 PDF:') ? (
                        <span className="text-emerald-500 text-sm">✓ PDF</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteClass.mutate(cls.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
