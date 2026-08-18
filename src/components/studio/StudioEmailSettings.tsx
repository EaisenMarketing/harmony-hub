import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import type { TeacherAccount } from '@/hooks/useTeacherStudio';

interface EmailSettingsRow {
  from_name: string | null;
  reply_to_email: string | null;
  logo_url: string | null;
  brand_color: string | null;
}

export const StudioEmailSettings = ({ account }: { account: TeacherAccount }) => {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['studio-email-settings', account.id],
    queryFn: async (): Promise<EmailSettingsRow | null> => {
      const { data, error } = await supabase
        .from('teacher_email_settings')
        .select('from_name, reply_to_email, logo_url, brand_color')
        .eq('account_id', account.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    from_name: '',
    reply_to_email: '',
    logo_url: '',
    brand_color: '',
  });

  useEffect(() => {
    setForm({
      from_name: data?.from_name ?? account.studio_name ?? '',
      reply_to_email: data?.reply_to_email ?? account.contact_email ?? '',
      logo_url: data?.logo_url ?? '',
      brand_color: data?.brand_color ?? '',
    });
  }, [data, account.studio_name, account.contact_email]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: res, error } = await supabase.rpc('save_studio_email_settings', {
        _account_id: account.id,
        _from_name: form.from_name || null,
        _reply_to_email: form.reply_to_email || null,
        _logo_url: form.logo_url || null,
        _brand_color: form.brand_color || null,
      });
      if (error) throw error;
      const row = (res as Array<{ ok: boolean; message: string }> | null)?.[0];
      if (row && !row.ok) throw new Error(row.message === 'invalid_email' ? 'El correo de respuesta no es válido' : row.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['studio-email-settings'] });
      toast({ title: 'Correo configurado', description: 'Tus alumnos verán tu nombre como remitente.' });
    },
    onError: (e) =>
      toast({
        title: 'No se pudo guardar',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      }),
  });

  return (
    <Card className="p-4 bg-card/70 border-white/10 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Correo de tu estudio</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Todos los correos que reciben <span className="text-foreground">tus alumnos</span> (bienvenida, recordatorios
        de clase, confirmaciones de pago, campañas) saldrán con este nombre y tus respuestas llegarán a tu correo. En
        el pie aparece un discreto “Powered by Acorde Live”.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre de remitente</Label>
          <Input
            placeholder="Estudio de Amanda"
            value={form.from_name}
            onChange={(e) => setForm({ ...form, from_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Correo de respuesta (reply-to)</Label>
          <Input
            type="email"
            placeholder="amanda@sucorreo.com"
            value={form.reply_to_email}
            onChange={(e) => setForm({ ...form, reply_to_email: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Logo de tu estudio (URL, opcional)</Label>
          <Input
            placeholder="https://..."
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Color de marca (opcional)</Label>
          <Input
            placeholder="#10b981"
            value={form.brand_color}
            onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Vista previa del remitente: <span className="text-foreground">{form.from_name || account.studio_name}</span>{' '}
        &lt;estudios@acordelive.com&gt;
      </p>

      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Guardar configuración de correo
      </Button>
    </Card>
  );
};
