import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Send, MessageCircleQuestion, Loader2 } from 'lucide-react';
import { useAnswerQuestion, useInstructorInbox } from '@/hooks/useTeacherQuestions';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const instrumentLabels: Record<string, string> = {
  guitar: 'Guitarra', piano: 'Piano', drums: 'Producción', banjo: 'Banjo',
};

export const InstructorQuestionsInbox = () => {
  const { data: questions, isLoading } = useInstructorInbox();
  const answer = useAnswerQuestion();
  const [replies, setReplies] = useState<Record<string, string>>({});

  const send = async (id: string) => {
    const text = replies[id]?.trim();
    if (!text || text.length < 5) {
      toast({ title: 'Respuesta muy corta', variant: 'destructive' });
      return;
    }
    try {
      await answer.mutateAsync({ id, answer: text });
      setReplies((r) => ({ ...r, [id]: '' }));
      toast({ title: 'Respuesta enviada' });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'No se pudo enviar', variant: 'destructive' });
    }
  };

  const open = questions?.filter((q) => q.status === 'open') || [];
  const answered = questions?.filter((q) => q.status === 'answered') || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5 text-primary" />
            Bandeja de consultas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
          {!isLoading && !open.length && (
            <p className="text-sm text-muted-foreground">No tienes consultas pendientes.</p>
          )}
          {open.map((q) => (
            <div key={q.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{q.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {instrumentLabels[q.instrument]} · {formatDistanceToNow(new Date(q.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pendiente</Badge>
              </div>
              <p className="text-sm whitespace-pre-wrap">{q.body}</p>
              {q.image_url && <img src={q.image_url} alt="" className="rounded-md max-h-60 object-cover" />}
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={replies[q.id] || ''}
                onChange={(e) => setReplies((r) => ({ ...r, [q.id]: e.target.value }))}
                rows={4}
              />
              <Button onClick={() => send(q.id)} disabled={answer.isPending} className="gap-2">
                {answer.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar respuesta
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {!!answered.length && (
        <Card>
          <CardHeader><CardTitle className="text-base">Respondidas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {answered.map((q) => (
              <div key={q.id} className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-medium">{q.title}</h4>
                  <Badge variant="default" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Respondida</Badge>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.body}</p>
                <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">Tu respuesta</p>
                  <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
