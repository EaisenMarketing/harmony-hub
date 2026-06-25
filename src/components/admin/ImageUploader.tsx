import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export const ImageUploader = ({ value, onChange, folder = 'thumbnails' }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato no válido',
        description: 'Por favor sube un archivo JPG, PNG, WebP o GIF',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Archivo muy grande',
        description: 'El tamaño máximo es 10MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('course-content')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-content')
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      
      toast({
        title: 'Imagen subida exitosamente',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Error al subir',
        description: error.message || 'No se pudo subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (value) {
      try {
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
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!value && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto" />
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Subir imagen
              </p>
            </>
          )}
        </div>
      )}

      {value && (
        <div className="relative group">
          <img loading="lazy" decoding="async"
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemove}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
