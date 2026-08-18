import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MailX, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Seo } from '@/lib/seo';

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('e') ?? '');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast({ title: 'Escribe un email válido', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('unsubscribe_email', { _email: email.trim() });
      if (error) throw error;
      if (!data) throw new Error('Email no válido');
      setDone(true);
    } catch (e) {
      toast({ title: 'No se pudo procesar', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Seo
        title="Darse de baja de correos | Acorde Live"
        description="Cancela la suscripción a los correos promocionales de Acorde Live."
        noindex
      />
      <Card className="w-full max-w-md p-6 space-y-4">
        {done ? (
          <div className="text-center space-y-2 py-6">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
            <h1 className="font-semibold">Listo, te dimos de baja</h1>
            <p className="text-sm text-muted-foreground">
              Ya no recibirás correos promocionales. Seguirás recibiendo avisos importantes de tu cuenta y tus clases.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/15">
                <MailX className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Darse de baja</h1>
                <p className="text-xs text-muted-foreground">Deja de recibir correos promocionales</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tu email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? 'Procesando…' : 'Darme de baja'}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default UnsubscribePage;
