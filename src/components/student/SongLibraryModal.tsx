import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Library, Lock, Trash2, Music2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SavedSong {
  id: string;
  youtube_url: string;
  song_title: string;
  artist: string;
  key: string;
  tempo: string;
  chords: string[];
  difficulty: string;
  created_at: string;
}

interface SongLibraryModalProps {
  userPlan: string;
}

export const SongLibraryModal = ({ userPlan }: SongLibraryModalProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isPro = ['pro', 'production'].includes(userPlan);

  const { data: savedSongs = [], isLoading } = useQuery({
    queryKey: ['saved-songs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_songs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavedSong[];
    },
    enabled: open && isPro,
  });

  const deleteMutation = useMutation({
    mutationFn: async (songId: string) => {
      const { error } = await supabase
        .from('saved_songs')
        .delete()
        .eq('id', songId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-songs'] });
      toast({
        title: 'Canción eliminada',
        description: 'La canción ha sido eliminada de tu biblioteca.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la canción.',
        variant: 'destructive',
      });
    },
  });

  if (!isPro) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Library className="w-4 h-4" />
            Mi Biblioteca
            <Lock className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Función Pro Exclusiva
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              La biblioteca de canciones está disponible exclusivamente para suscripciones Pro.
            </p>
            <Button variant="premium">Actualizar a Pro</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Library className="w-4 h-4" />
          Mi Biblioteca
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="w-5 h-5" />
            Mi Biblioteca de Canciones
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : savedSongs.length === 0 ? (
          <div className="text-center py-12">
            <Music2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aún no tienes canciones guardadas.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Usa el Analizador de Canciones y guarda tus análisis aquí.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {savedSongs.map((song) => (
                <Card key={song.id} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{song.song_title}</h4>
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            🎵 {song.key}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ⏱️ {song.tempo}
                          </Badge>
                          <Badge 
                            variant={song.difficulty === 'Fácil' ? 'default' : song.difficulty === 'Intermedio' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {song.difficulty}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {song.chords?.slice(0, 6).map((chord, i) => (
                            <span key={i} className="text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">
                              {chord}
                            </span>
                          ))}
                          {song.chords?.length > 6 && (
                            <span className="text-xs text-muted-foreground">+{song.chords.length - 6} más</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(song.youtube_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar canción?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará "{song.song_title}" de tu biblioteca permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(song.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Guardado el {new Date(song.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
