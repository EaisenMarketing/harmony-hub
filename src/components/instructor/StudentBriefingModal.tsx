import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, RotateCcw, Clock, CalendarCheck, HelpCircle, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BriefingStats {
  studentName: string;
  instrument: string | null;
  totalMinutes: number;
  daysPracticed: number;
  weeklyGoal: number;
  openQuestions: number;
  courseProgress: { title: string; completedLessons: number; totalLessons: number } | null;
}

interface StudentBriefingModalProps {
  studentId: string;
  studentName: string;
}

export const StudentBriefingModal = ({ studentId, studentName }: StudentBriefingModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<string | null>(null);
  const [stats, setStats] = useState<BriefingStats | null>(null);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    setBriefing(null);
    setStats(null);
    try {
      const { data, error } = await supabase.functions.invoke('student-briefing', {
        body: { studentId },
      });
      if (error) throw error;
      if (data?.success && data.briefing) {
        setBriefing(data.briefing);
        setStats(data.stats);
      } else {
        throw new Error(data?.error || 'No se pudo generar el briefing');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error inesperado';
      toast({ title: 'Error generando el briefing', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !briefing && !loading) generate();
  };

  const reset = () => {
    setBriefing(null);
    setStats(null);
    generate();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Ver briefing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Briefing pre-clase · {studentName}
          </DialogTitle>
          <DialogDescription>
            Resumen de las últimas 2 semanas, generado por IA, para preparar tu clase de hoy.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>Analizando la actividad de {studentName}...</p>
            </div>
          ) : briefing ? (
            <div className="h-full flex flex-col">
              {stats && (
                <div className="flex flex-wrap gap-2 pb-3">
                  <Badge variant="secondary" className="gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {stats.totalMinutes} min / {stats.weeklyGoal * 2} min (14 días)
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {stats.daysPracticed} días practicados
                  </Badge>
                  {stats.openQuestions > 0 && (
                    <Badge variant="destructive" className="gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {stats.openQuestions} pregunta{stats.openQuestions > 1 ? 's' : ''} sin responder
                    </Badge>
                  )}
                  {stats.courseProgress && (
                    <Badge variant="secondary" className="gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {stats.courseProgress.title}: {stats.courseProgress.completedLessons}/{stats.courseProgress.totalLessons} lecciones
                    </Badge>
                  )}
                </div>
              )}
              <ScrollArea className="flex-1 pr-3">
                <div className="prose prose-sm dark:prose-invert max-w-none pb-4">
                  <ReactMarkdown>{briefing}</ReactMarkdown>
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Actualizar
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 opacity-50" />
              <p>No se pudo generar el briefing.</p>
              <Button onClick={generate} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
