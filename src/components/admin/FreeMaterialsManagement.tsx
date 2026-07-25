import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Copy, Download, ExternalLink, FileText, Loader2, Plus, Trash2, Users } from 'lucide-react';

type Material = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  pdf_path: string;
  instagram_keyword: string | null;
  is_active: boolean;
  created_at: string;
};

type Lead = {
  id: string;
  material_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  instagram_handle: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const FreeMaterialsManagement = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    instagram_keyword: '',
    cover_image_url: '',
    is_active: true,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: mats }, { data: lds }] = await Promise.all([
      supabase.from('free_materials').select('*').order('created_at', { ascending: false }),
      supabase.from('material_leads').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setMaterials((mats as Material[]) ?? []);
    setLeads((lds as Lead[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      toast({ title: 'Falta el PDF', description: 'Selecciona un archivo PDF.', variant: 'destructive' });
      return;
    }
    if (!form.title.trim()) return;
    setUploading(true);
    try {
      const slug = (form.slug.trim() || slugify(form.title)) || `material-${Date.now()}`;
      const path = `${slug}-${Date.now()}.pdf`;

      const { error: upErr } = await supabase.storage
        .from('free-materials')
        .upload(path, pdfFile, { contentType: 'application/pdf', upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('free_materials').insert({
        title: form.title.trim(),
        slug,
        description: form.description.trim() || null,
        instagram_keyword: form.instagram_keyword.trim() || null,
        cover_image_url: form.cover_image_url.trim() || null,
        pdf_path: path,
        is_active: form.is_active,
      });
      if (insErr) throw insErr;

      toast({ title: 'Material publicado 🎉' });
      setForm({ title: '', slug: '', description: '', instagram_keyword: '', cover_image_url: '', is_active: true });
      setPdfFile(null);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Intenta de nuevo';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (m: Material) => {
    await supabase.from('free_materials').update({ is_active: !m.is_active }).eq('id', m.id);
    load();
  };

  const remove = async (m: Material) => {
    if (!confirm(`¿Eliminar "${m.title}"?`)) return;
    await supabase.storage.from('free-materials').remove([m.pdf_path]);
    await supabase.from('free_materials').delete().eq('id', m.id);
    load();
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/material-gratis/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado', description: url });
  };

  const exportLeadsCSV = () => {
    const materialMap = new Map(materials.map((m) => [m.id, m.title]));
    const rows = [
      ['Fecha', 'Nombre', 'Email', 'Instagram', 'Teléfono', 'Material', 'Estado'],
      ...leads.map((l) => [
        new Date(l.created_at).toISOString(),
        l.full_name,
        l.email,
        l.instagram_handle ?? '',
        l.phone ?? '',
        materialMap.get(l.material_id ?? '') ?? '',
        l.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-material-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <Tabs defaultValue="materiales" className="space-y-4">
      <TabsList>
        <TabsTrigger value="materiales"><FileText className="w-4 h-4 mr-2" />Materiales</TabsTrigger>
        <TabsTrigger value="leads"><Users className="w-4 h-4 mr-2" />CRM Leads ({leads.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="materiales" className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">Sube PDFs gratuitos para captar leads desde Instagram u otras redes.</p>
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus className="w-4 h-4 mr-2" /> {showForm ? 'Cancelar' : 'Nuevo material'}
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader><CardTitle>Nuevo material gratuito</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} required />
                  </div>
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="mi-material" />
                  </div>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Palabra clave de Instagram</Label>
                    <Input value={form.instagram_keyword} onChange={(e) => setForm({ ...form, instagram_keyword: e.target.value })} placeholder="ej. ACORDES" />
                  </div>
                  <div>
                    <Label>URL de imagen de portada (opcional)</Label>
                    <Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <Label>Archivo PDF *</Label>
                  <Input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} required />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <span className="text-sm">Publicado</span>
                </div>
                <Button type="submit" disabled={uploading}>
                  {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo...</> : 'Publicar material'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {materials.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aún no tienes materiales. Sube el primero.</p>
          )}
          {materials.map((m) => {
            const leadCount = leads.filter((l) => l.material_id === m.id).length;
            return (
              <Card key={m.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{m.title}</h3>
                      <Badge variant={m.is_active ? 'default' : 'secondary'}>{m.is_active ? 'Activo' : 'Oculto'}</Badge>
                      <Badge variant="outline">{leadCount} leads</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">/material-gratis/{m.slug}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => copyLink(m.slug)}><Copy className="w-4 h-4 mr-1" />Link</Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`/material-gratis/${m.slug}`} target="_blank" rel="noopener"><ExternalLink className="w-4 h-4 mr-1" />Ver</a>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(m)}>
                      {m.is_active ? 'Ocultar' : 'Publicar'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(m)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="leads" className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{leads.length} prospectos capturados</p>
          <Button variant="outline" onClick={exportLeadsCSV}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
        </div>

        <div className="grid gap-2">
          {leads.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aún no hay leads.</p>
          )}
          {leads.map((l) => {
            const mat = materials.find((m) => m.id === l.material_id);
            return (
              <Card key={l.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{l.full_name}</p>
                      <p className="text-sm text-muted-foreground break-all">{l.email}</p>
                      {l.instagram_handle && <p className="text-xs text-muted-foreground">IG: {l.instagram_handle}</p>}
                      {l.phone && <p className="text-xs text-muted-foreground">Tel: {l.phone}</p>}
                    </div>
                    <div className="text-right text-xs">
                      {mat && <Badge variant="outline" className="mb-1">{mat.title}</Badge>}
                      <p className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
};
