import { useEffect, useState } from 'react';
import { z } from 'zod';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Category = 'access' | 'billing' | 'technical' | 'other';

const CATEGORIES: { value: Category; label: string; hint: string }[] = [
  { value: 'access', label: 'Acceso a la cuenta', hint: 'Login, contraseña, verificación de email, sesión' },
  { value: 'billing', label: 'Facturación / Pagos', hint: 'Cobros, reembolsos, cambios de plan, facturas' },
  { value: 'technical', label: 'Problema técnico', hint: 'Video no carga, error en la app, bug' },
  { value: 'other', label: 'Otro', hint: 'Cualquier otro tema' },
];

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  new: { label: 'Recibida', tone: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  in_progress: { label: 'En proceso', tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  waiting: { label: 'Esperando respuesta', tone: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  resolved: { label: 'Resuelta', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  closed: { label: 'Cerrada', tone: 'bg-white/10 text-white/60 border-white/20' },
};

const schema = z.object({
  full_name: z.string().trim().min(2, 'Nombre demasiado corto').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  category: z.enum(['access', 'billing', 'technical', 'other']),
  message: z.string().trim().min(10, 'Describe el problema con un poco más de detalle').max(2000),
});

interface Ticket {
  id: string;
  full_name: string;
  email: string;
  message: string;
  source: string | null;
  status: string;
  created_at: string;
}

export default function SupportPage() {
  const [form, setForm] = useState({ full_name: '', email: '', category: 'access' as Category, message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [failMsg, setFailMsg] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  const loadTickets = async () => {
    setLoadingTickets(true);
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user?.email) {
      setIsAuthed(false);
      setTickets([]);
      setLoadingTickets(false);
      return;
    }
    setIsAuthed(true);
    setForm(f => ({ ...f, email: f.email || user.email!, full_name: f.full_name || (user.user_metadata?.full_name ?? '') }));
    const { data, error } = await (supabase as any)
      .from('contact_leads')
      .select('id, full_name, email, message, source, status, created_at')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) setTickets(data as Ticket[]);
    setLoadingTickets(false);
  };

  useEffect(() => {
    loadTickets();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadTickets());
    return () => sub.subscription.unsubscribe();
  }, []);

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
      message: parsed.data.message,
      source: `support:${parsed.data.category}`,
      status: 'new',
    });
    setSending(false);
    if (error) {
      setFailMsg('No pudimos enviar tu solicitud. Escríbenos a soporte@acordelive.com.');
      return;
    }
    toast.success('Solicitud enviada', {
      description: 'Te responderemos por email en menos de 24 horas hábiles.',
    });
    setForm({ ...form, message: '' });
    loadTickets();
  }

  const categoryLabel = (source: string | null) => {
    const key = source?.startsWith('support:') ? source.slice(8) : '';
    return CATEGORIES.find(c => c.value === key)?.label ?? 'Consulta general';
  };

  return (
    <PublicLayout>
      <Seo
        title="Soporte | Acorde Live"
        description="Reporta problemas de acceso, facturación o técnicos. Respondemos en menos de 24 horas hábiles."
        path="/soporte"
      />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Centro de Soporte</h1>
        <p className="text-white/60 mb-10 max-w-2xl">
          ¿Problemas para acceder a tu cuenta o con un cobro? Cuéntanos y lo resolvemos.
          También puedes escribirnos a{' '}
          <a href="mailto:soporte@acordelive.com" className="text-primary underline">soporte@acordelive.com</a>.
        </p>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Formulario */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-bold text-white mb-4">Nueva solicitud</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-white/70">Categoría</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setForm({ ...form, category: c.value })}
                      className={`text-left rounded-lg border px-3 py-2 transition ${
                        form.category === c.value
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">{c.label}</div>
                      <div className="text-[11px] text-white/50 leading-tight">{c.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

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
                {isAuthed && (
                  <p className="text-[11px] text-white/40 mt-1">
                    Usa el mismo email de tu cuenta para dar seguimiento aquí.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm text-white/70">Describe el problema</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  rows={6}
                  placeholder="Incluye pasos para reproducirlo, mensajes de error o el ID del cobro."
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
                {sending ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </form>
          </section>

          {/* Estado de solicitudes */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h2 className="text-xl font-bold text-white mb-4">Mis solicitudes</h2>
            {!isAuthed ? (
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-white/60">
                Inicia sesión con el email en el que envías las solicitudes para ver su estado en esta sección.
              </div>
            ) : loadingTickets ? (
              <div className="text-sm text-white/50">Cargando…</div>
            ) : tickets.length === 0 ? (
              <div className="text-sm text-white/50">Todavía no tienes solicitudes registradas.</div>
            ) : (
              <ul className="space-y-3">
                {tickets.map(t => {
                  const st = STATUS_LABELS[t.status] ?? STATUS_LABELS.new;
                  return (
                    <li key={t.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs uppercase tracking-wide text-white/40">
                          {categoryLabel(t.source)}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${st.tone}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 line-clamp-3">{t.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
                        <span>#{t.id.slice(0, 8)}</span>
                        <span>{new Date(t.created_at).toLocaleString()}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
