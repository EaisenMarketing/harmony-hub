import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Video, X, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export const VideoUploader = ({ value, onChange, folder = 'videos' }: VideoUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato no válido',
        description: 'Por favor sube un archivo MP4, WebM, MOV o AVI',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Archivo muy grande',
        description: 'El tamaño máximo es 500MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Simulate progress (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('course-content')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-content')
        .getPublicUrl(data.path);

      setProgress(100);
      onChange(urlData.publicUrl);
      
      toast({
        title: 'Video subido exitosamente',
        description: 'El video está listo para usar',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error al subir',
        description: error.message || 'No se pudo subir el video',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (value) {
      try {
        // Extract path from URL
        const url = new URL(value);
        const pathParts = url.pathname.split('/course-content/');
        if (pathParts[1]) {
          await supabase.storage
            .from('course-content')
            .remove([decodeURIComponent(pathParts[1])]);
        }
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }
    onChange('');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!value && !isUploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Haz clic para subir un video
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            MP4, WebM, MOV o AVI (máx. 500MB)
          </p>
        </div>
      )}

      {isUploading && (
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Subiendo video...</p>
              <p className="text-xs text-muted-foreground">{progress}% completado</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {value && !isUploading && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Video cargado</p>
              <p className="text-xs text-muted-foreground truncate">
                {value.split('/').pop()}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            Video privado. Los estudiantes lo verán mediante una URL firmada temporal.
          </p>

        </div>
      )}
    </div>
  );
};
