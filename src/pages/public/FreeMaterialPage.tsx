import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Download, CheckCircle2, FileText, Instagram, Loader2, Music } from 'lucide-react';
import logo from '@/assets/logo.webp';

interface Material {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  pdf_path: string;
  instagram_keyword: string | null;
}

export default function FreeMaterialPage() {
  const { slug } = useParams();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    instagram_handle: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase.from('free_materials').select('*').eq('is_active', true);
      if (slug) {
        query = query.eq('slug', slug);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }
      const { data } = await query.maybeSingle();
      setMaterial(data as Material | null);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: 'Faltan datos', description: 'Ingresa tu nombre y email.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error: leadError } = await supabase.from('material_leads').insert({
        material_id: material.id,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        instagram_handle: form.instagram_handle.trim() || null,
        source: 'landing_free_material',
        status: 'new',
      });
      if (leadError) throw leadError;

      const { data: signed, error: signErr } = await supabase.storage
        .from('free-materials')
        .createSignedUrl(material.pdf_path, 60 * 60);
      if (signErr || !signed?.signedUrl) throw signErr ?? new Error('No se pudo generar la descarga');

      setDownloadUrl(signed.signedUrl);
      toast({ title: '¡Listo! 🎉', description: 'Tu material está listo para descargar.' });
      window.open(signed.signedUrl, '_blank', 'noopener');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Ocurrió un error',
        description: 'Intenta de nuevo en un momento.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,5%)]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(222,47%,5%)] text-center px-4">
        <Seo title="Material no disponible" description="Este material gratuito no está disponible." noindex path={`/material-gratis/${slug ?? ''}`} />
        <FileText className="w-12 h-12 text-white/40 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Material no disponible</h1>
        <p className="text-white/60 mb-6">El material que buscas no existe o fue removido.</p>
        <Link to="/"><Button variant="outline">Volver al inicio</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)] text-white relative overflow-hidden">
      <Seo
        title={material.title}
        description={material.description ?? 'Descarga gratis este material para músicos que quieren crecer.'}
        path={`/material-gratis/${material.slug}`}
        image={material.cover_image_url ?? undefined}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute top-0 -left-24 w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-24 w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <header className="relative z-10 px-4 pt-6 pb-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Acorde Live" className="w-9 h-9 rounded-lg object-cover" />
          <span className="font-bold">Acorde Live</span>
        </Link>
        <Link to="/cursos" className="text-sm text-white/70 hover:text-white">Ver cursos →</Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
          {/* Left: hero */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 mb-4">
              <Music className="w-3.5 h-3.5" /> Material gratuito
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              {material.title}
            </h1>
            <p className="text-white/70 text-base md:text-lg mb-6 leading-relaxed">
              {material.description ?? 'Un recurso pensado para músicos que quieren crecer, mejorar su técnica y llevar su arte al siguiente nivel.'}
            </p>
            <ul className="space-y-2 mb-6">
              {['PDF descargable al instante', 'Creado por maestros de Acorde Live', 'Ideal para todos los niveles'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {t}
                </li>
              ))}
            </ul>
            {material.instagram_keyword && (
              <div className="inline-flex items-center gap-2 text-xs text-white/50">
                <Instagram className="w-4 h-4" /> Palabra clave: <span className="text-white/80 font-mono">{material.instagram_keyword}</span>
              </div>
            )}
          </div>

          {/* Right: form */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            {material.cover_image_url && (
              <img
                src={material.cover_image_url}
                alt={material.title}
                className="w-full h-40 object-cover rounded-2xl mb-6 border border-white/10"
              />
            )}

            {downloadUrl ? (
              <div className="text-center py-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">¡Descarga iniciada!</h3>
                <p className="text-white/60 text-sm mb-6">Si no se abrió automáticamente, usa el botón:</p>
                <a href={downloadUrl} target="_blank" rel="noopener">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Download className="w-4 h-4 mr-2" /> Descargar PDF de nuevo
                  </Button>
                </a>
                <Link to="/cursos" className="inline-block mt-6 text-sm text-white/60 hover:text-white">
                  ¿Listo para dar el siguiente paso? Ver cursos →
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">Descárgalo gratis</h2>
                <p className="text-sm text-white/60 mb-5">Solo dinos a dónde enviar tu material.</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="full_name">Nombre completo *</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required
                      placeholder="Tu nombre"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      placeholder="tu@email.com"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram_handle">Usuario de Instagram (opcional)</Label>
                    <Input
                      id="instagram_handle"
                      value={form.instagram_handle}
                      onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                      placeholder="@tu_usuario"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">WhatsApp (opcional)</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+52 ..."
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-indigo-500 hover:opacity-90 text-white font-semibold py-6"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparando...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" /> Descargar PDF gratis</>
                    )}
                  </Button>
                  <p className="text-[11px] text-white/40 text-center pt-1">
                    Al enviar aceptas recibir contenido de Acorde Live. Puedes darte de baja cuando quieras.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
