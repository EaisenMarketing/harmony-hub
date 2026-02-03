import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Send, Loader2, Lock, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface MusicTheoryAssistantProps {
  userPlan: string;
}

export const MusicTheoryAssistant = ({ userPlan }: MusicTheoryAssistantProps) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const allowedPlans = ['standard', 'pro'];
  const hasAccess = allowedPlans.includes(userPlan);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = question.trim();
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('music-theory-assistant', {
        body: { 
          question: userMessage,
          conversationHistory: messages 
        },
      });

      if (error) throw error;

      if (data.success && data.answer) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        throw new Error(data.error || 'Error obteniendo respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo obtener una respuesta. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    '¿Qué es el modo Dórico y cómo lo uso?',
    '¿Cómo funciona el círculo de quintas?',
    'Explícame la progresión II-V-I',
    '¿Qué escalas usar sobre acordes dominantes?',
  ];

  if (!hasAccess) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <BookOpen className="w-4 h-4" />
            Asistente de Teoría
            <Lock className="w-3 h-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Función Premium
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              El asistente de teoría musical con IA está disponible para suscripciones Standard y Pro.
            </p>
            <Button variant="premium">Actualizar Suscripción</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Asistente de Teoría
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Asistente de Teoría Musical
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Bot className="w-16 h-16 text-primary/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">¡Hola! Soy tu asistente de teoría musical</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Pregúntame sobre armonía, modos griegos, progresiones de acordes, escalas, 
                o cualquier duda sobre teoría musical.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {exampleQuestions.map((q, idx) => (
                  <Button
                    key={idx}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setQuestion(q);
                    }}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4 py-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="border-t pt-4 mt-auto">
            <div className="flex gap-2">
              <Textarea
                placeholder="Escribe tu pregunta sobre teoría musical..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuestion();
                  }
                }}
                className="min-h-[60px] resize-none"
              />
              <Button
                onClick={handleSendQuestion}
                disabled={loading || !question.trim()}
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
