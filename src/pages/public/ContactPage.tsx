import { useState } from 'react';
import { z } from 'zod';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';

const schema = z.object({
  full_name: z.string().trim().min(2, 'Nombre demasiado corto').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Cuéntanos un poco más').max(2000),
});

export default function ContactPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failMsg, setFailMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({}); setFailMsg(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (v && v[0]) flat[k] = v[0];
      }
      setErrors(flat);
      return;
    }
    setSending(true);
    const { error } = await (supabase as any).from('contact_leads').insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
      source: 'contact_page',
      status: 'new',
    });
    setSending(false);
    if (error) {
      setFailMsg('No pudimos enviar tu mensaje. Escríbenos a hola@acordelive.com.');
      return;
    }
    setSent(true);
  }

  return (
    <PublicLayout>
      <Seo title="Contacto" description="Escríbenos: dudas sobre cursos, planes, becas o cualquier cosa." path="/contacto" />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Contacto</h1>
        <p className="text-white/60 mb-8">
          Respondemos en menos de 24 horas hábiles. También puedes escribirnos a{' '}
          <a href="mailto:hola@acordelive.com" className="text-primary underline">hola@acordelive.com</a>.
        </p>

        {sent ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-white">
            ¡Gracias! Recibimos tu mensaje y te contactaremos pronto.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-white/70">Nombre completo</label>
              <input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                required
              />
              {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <label className="text-sm text-white/70">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                required
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm text-white/70">Teléfono (opcional)</label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/70">Mensaje</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white"
                required
              />
              {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
            </div>
            {failMsg && <p className="text-sm text-red-400">{failMsg}</p>}
            <button
              disabled={sending}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-6 py-3 font-semibold text-white disabled:opacity-60"
            >
              {sending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
}
