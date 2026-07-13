import { useState, useMemo, useEffect } from 'react';
import { Play, Filter, Music, Search, Upload, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VideoUploadForm } from './VideoUploadForm';
import type { Database } from '@/integrations/supabase/types';

type InstrumentType = Database['public']['Enums']['instrument_type'];

const instrumentLabels: Record<string, string> = {
  guitar: '🎸 Guitarra',
  piano: '🎹 Piano',
  drums: '🥁 Batería',
};

const levelLabels: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

interface LessonWithCourse {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  module: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      instrument: InstrumentType;
      level: string;
      thumbnail_url: string | null;
    };
  };
}

export const VideoLibrary = () => {
  const [selectedInstrument, setSelectedInstrument] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<LessonWithCourse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    if (!selectedVideo?.id || !selectedVideo.video_url) {
      setPreviewUrl(null);
      setPreviewError(null);
      return;
    }
    const raw = selectedVideo.video_url;
    if (!raw.includes('/course-content/')) {
      setPreviewUrl(raw);
      return;
    }
    let cancelled = false;
    setPreviewUrl(null);
    setPreviewError(null);
    supabase.functions
      .invoke('get-video-signed-url', { body: { lessonId: selectedVideo.id } })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.url) {
          setPreviewError(error?.message || data?.error || 'No se pudo cargar el video');
          return;
        }
        setPreviewUrl(data.url);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedVideo]);


  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['admin-video-library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          video_url,
          duration_minutes,
          module:course_modules!inner (
            id,
            title,
            course:courses!inner (
              id,
              title,
              instrument,
              level,
              thumbnail_url
            )
          )
        `)
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to flatten the structure
      return (data || []).map((lesson: any) => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        video_url: lesson.video_url,
        duration_minutes: lesson.duration_minutes,
        module: {
          id: lesson.module.id,
          title: lesson.module.title,
          course: lesson.module.course,
        },
      })) as LessonWithCourse[];
    },
  });

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesInstrument = selectedInstrument === 'all' || lesson.module.course.instrument === selectedInstrument;
      const matchesSearch = !searchQuery || 
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.module.course.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesInstrument && matchesSearch;
    });
  }, [lessons, selectedInstrument, searchQuery]);

  const videosByInstrument = useMemo(() => {
    const grouped: Record<string, LessonWithCourse[]> = {
      guitar: [],
      piano: [],
      drums: [],
    };

    filteredLessons.forEach((lesson) => {
      grouped[lesson.module.course.instrument].push(lesson);
    });

    return grouped;
  }, [filteredLessons]);

  const stats = useMemo(() => {
    return {
      total: lessons.length,
      guitar: lessons.filter((l) => l.module.course.instrument === 'guitar').length,
      piano: lessons.filter((l) => l.module.course.instrument === 'piano').length,
      drums: lessons.filter((l) => l.module.course.instrument === 'drums').length,
    };
  }, [lessons]);

  if (isLoading) {
    return <div className="h-64 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Upload Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Biblioteca de Videos</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona todos los videos de tus cursos
            </p>
          </div>
          <Button onClick={() => setShowUploadForm(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            Subir Video
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Videos</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-primary/5">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">🎸 {stats.guitar}</div>
              <p className="text-sm text-muted-foreground">Guitarra</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-secondary/5">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">🎹 {stats.piano}</div>
              <p className="text-sm text-muted-foreground">Piano</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-destructive/5">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">🥁 {stats.drums}</div>
              <p className="text-sm text-muted-foreground">Batería</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-accent/20">
            <CardContent className="pt-4">
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedInstrument} onValueChange={setSelectedInstrument}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Instrumento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los instrumentos</SelectItem>
                  <SelectItem value="guitar">🎸 Guitarra</SelectItem>
                  <SelectItem value="piano">🎹 Piano</SelectItem>
                  <SelectItem value="drums">🥁 Batería</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Videos by Instrument */}
        {selectedInstrument === 'all' ? (
          Object.entries(videosByInstrument).map(([instrument, videos]) => {
            if (videos.length === 0) return null;
            return (
              <Card key={instrument} className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {instrumentLabels[instrument as InstrumentType]}
                    <Badge variant="secondary">{videos.length} videos</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((lesson) => (
                      <VideoCard
                        key={lesson.id}
                        lesson={lesson}
                        onPlay={() => setSelectedVideo(lesson)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                {instrumentLabels[selectedInstrument as InstrumentType]}
                <Badge variant="secondary">{filteredLessons.length} videos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLessons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay videos para este instrumento.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLessons.map((lesson) => (
                    <VideoCard
                      key={lesson.id}
                      lesson={lesson}
                      onPlay={() => setSelectedVideo(lesson)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {lessons.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No hay videos aún</h3>
              <p className="text-muted-foreground">
                Agrega videos a las lecciones de tus cursos para verlos aquí.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">
                {selectedVideo && instrumentLabels[selectedVideo.module.course.instrument].split(' ')[0]}
              </span>
              {selectedVideo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {!selectedVideo?.video_url ? (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  Video no disponible
                </div>
              ) : previewError ? (
                <div className="w-full h-full flex items-center justify-center text-white/70 text-sm p-4 text-center">
                  {previewError}
                </div>
              ) : !previewUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white/70" />
                </div>
              ) : (
                <video src={previewUrl} controls autoPlay className="w-full h-full">
                  Tu navegador no soporta la reproducción de video.
                </video>
              )}

            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{selectedVideo?.module.course.title}</Badge>
                <Badge variant="secondary">{selectedVideo?.module.title}</Badge>
                {selectedVideo && (
                  <Badge>{levelLabels[selectedVideo.module.course.level]}</Badge>
                )}
                {selectedVideo?.duration_minutes && (
                  <Badge variant="outline">{selectedVideo.duration_minutes} min</Badge>
                )}
              </div>
              {selectedVideo?.description && (
                <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Form Modal */}
      <VideoUploadForm 
        open={showUploadForm} 
        onClose={() => setShowUploadForm(false)} 
      />
    </>
  );
};

interface VideoCardProps {
  lesson: LessonWithCourse;
  onPlay: () => void;
}

const VideoCard = ({ lesson, onPlay }: VideoCardProps) => {
  return (
    <div 
      className="group relative bg-muted/50 rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onPlay}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative bg-gradient-to-br from-primary/20 to-secondary/20">
        {lesson.module.course.thumbnail_url ? (
          <img loading="lazy" decoding="async"
            src={lesson.module.course.thumbnail_url}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>
        {/* Duration Badge */}
        {lesson.duration_minutes && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs">
            {lesson.duration_minutes} min
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3 space-y-1">
        <h4 className="font-medium text-sm line-clamp-2">{lesson.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {lesson.module.course.title} • {lesson.module.title}
        </p>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {levelLabels[lesson.module.course.level]}
          </Badge>
        </div>
      </div>
    </div>
  );
};
