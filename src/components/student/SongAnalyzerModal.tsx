import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Music2, Loader2, Lock, Youtube, ListMusic, Layers, TrendingUp, FileDown, Save, Crown, ImageDown, Pencil, Check, X, Plus, Trash2, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ChordSheet } from './ChordSheet';

interface SongAnalysis {
  songTitle: string;
  artist: string;
  key: string;
  tempo: string;
  timeSignature: string;
  chords: string[];
  structure: {
    section: string;
    chords: string[];
    bars: number;
  }[];
  progression: {
    name: string;
    numerals: string;
    description: string;
  };
  difficulty: string;
  tips: string[];
  similarSongs: string[];
}

interface SongAnalyzerModalProps {
  userPlan: string;
}

export const SongAnalyzerModal = ({ userPlan }: SongAnalyzerModalProps) => {
  const [open, setOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  const [originalAnalysis, setOriginalAnalysis] = useState<SongAnalysis | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [fromCorrection, setFromCorrection] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const hasAccess = ['standard', 'pro', 'production'].includes(userPlan);
  const isPro = ['pro', 'production'].includes(userPlan);

  const extractVideoInfo = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleAnalyzeSong = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un enlace de YouTube',
        variant: 'destructive',
      });
      return;
    }

    const videoId = extractVideoInfo(youtubeUrl);
    if (!videoId) {
      toast({
        title: 'Enlace inválido',
        description: 'Por favor ingresa un enlace válido de YouTube',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setOriginalAnalysis(null);
    setEditMode(false);
    setFromCorrection(false);
    setCurrentVideoId(videoId);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-song', {
        body: { youtubeUrl: youtubeUrl.trim(), videoId },
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setOriginalAnalysis(data.analysis);
        setFromCorrection(!!data.fromCorrection);
        if (data.fromCorrection) {
          toast({
            title: 'Versión corregida',
            description: 'Cargamos tu corrección previa para esta canción.',
          });
        }
      } else {
        throw new Error(data.error || 'Error analizando la canción');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo analizar la canción. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ---- Edit / correction helpers ----
  const updateField = <K extends keyof SongAnalysis>(key: K, value: SongAnalysis[K]) => {
    setAnalysis((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateProgression = (field: 'name' | 'numerals' | 'description', value: string) => {
    setAnalysis((prev) => (prev ? { ...prev, progression: { ...prev.progression, [field]: value } } : prev));
  };

  const updateSection = (index: number, field: 'section' | 'chords' | 'bars', value: string | number | string[]) => {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const structure = [...prev.structure];
      structure[index] = { ...structure[index], [field]: value } as SongAnalysis['structure'][number];
      return { ...prev, structure };
    });
  };

  const addSection = () => {
    setAnalysis((prev) => prev ? { ...prev, structure: [...prev.structure, { section: 'Nueva sección', chords: [], bars: 4 }] } : prev);
  };

  const removeSection = (index: number) => {
    setAnalysis((prev) => prev ? { ...prev, structure: prev.structure.filter((_, i) => i !== index) } : prev);
  };

  const handleSaveCorrection = async () => {
    if (!analysis || !user || !currentVideoId) return;
    setSavingCorrection(true);
    try {
      const { error } = await supabase
        .from('song_corrections')
        .upsert([{
          user_id: user.id,
          video_id: currentVideoId,
          youtube_url: youtubeUrl,
          corrected_analysis: JSON.parse(JSON.stringify(analysis)),
        }], { onConflict: 'user_id,video_id' });
      if (error) throw error;
      setOriginalAnalysis(analysis);
      setFromCorrection(true);
      setEditMode(false);
      toast({
        title: 'Corrección guardada',
        description: 'Se aplicará automáticamente la próxima vez que analices esta canción.',
      });
    } catch (e) {
      console.error('save correction error', e);
      toast({ title: 'Error', description: 'No se pudo guardar la corrección.', variant: 'destructive' });
    } finally {
      setSavingCorrection(false);
    }
  };

  const handleResetCorrection = async () => {
    if (!user || !currentVideoId) return;
    setSavingCorrection(true);
    try {
      const { error } = await supabase
        .from('song_corrections')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', currentVideoId);
      if (error) throw error;
      setFromCorrection(false);
      setEditMode(false);
      toast({ title: 'Corrección eliminada', description: 'Volveré a analizar desde cero la próxima vez.' });
      await handleAnalyzeSong();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'No se pudo eliminar la corrección.', variant: 'destructive' });
    } finally {
      setSavingCorrection(false);
    }
  };

  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null);

  const captureSheet = async () => {
    if (!sheetRef.current) throw new Error('Sheet not rendered');
    return await html2canvas(sheetRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
  };

  const handleExportPDF = async () => {
    if (!analysis) return;
    setExporting('pdf');
    try {
      const canvas = await captureSheet();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${analysis.songTitle} - ${analysis.artist} - Acordes.pdf`);
      toast({
        title: 'PDF Exportado',
        description: 'La hoja de acordes se descargó como PDF.',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'No se pudo exportar el PDF.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportPNG = async () => {
    if (!analysis) return;
    setExporting('png');
    try {
      const canvas = await captureSheet();
      const link = document.createElement('a');
      link.download = `${analysis.songTitle} - ${analysis.artist} - Acordes.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({
        title: 'Imagen exportada',
        description: 'La hoja de acordes se descargó como PNG.',
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: 'No se pudo exportar la imagen.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };



  const handleSaveToLibrary = async () => {
    if (!analysis || !user) return;

    setSaving(true);
    try {
      const videoId = extractVideoInfo(youtubeUrl);
      
      const { error } = await supabase.from('saved_songs').insert({
        user_id: user.id,
        youtube_url: youtubeUrl,
        video_id: videoId,
        song_title: analysis.songTitle,
        artist: analysis.artist,
        key: analysis.key,
        tempo: analysis.tempo,
        time_signature: analysis.timeSignature,
        chords: analysis.chords,
        structure: analysis.structure,
        progression: analysis.progression,
        difficulty: analysis.difficulty,
        tips: analysis.tips,
        similar_songs: analysis.similarSongs,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['saved-songs'] });

      toast({
        title: 'Canción Guardada',
        description: 'La canción ha sido añadida a tu biblioteca.',
      });
    } catch (error) {
      console.error('Error saving song:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la canción.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!hasAccess) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Youtube className="w-4 h-4" />
            Analizador de Canciones
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
              El analizador de canciones con IA está disponible para suscripciones Standard y Pro.
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
          <Youtube className="w-4 h-4" />
          Analizador de Canciones
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="w-5 h-5" />
            Analizador de Canciones con IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pega el enlace de YouTube aquí..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeSong()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleAnalyzeSong} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Music2 className="w-4 h-4" />}
              {loading ? 'Analizando...' : 'Analizar'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Nuestra IA con oído perfecto analizará la canción para extraer acordes, estructura y progresiones armónicas.
          </p>

          {analysis && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              {/* Status + Edit Actions */}
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex flex-wrap gap-2 items-center">
                  {fromCorrection && !editMode && (
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" /> Tu versión corregida
                    </Badge>
                  )}
                  {editMode && (
                    <Badge className="gap-1">
                      <Pencil className="w-3 h-3" /> Modo edición
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!editMode ? (
                    <>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditMode(true)}>
                        <Pencil className="w-4 h-4" /> Editar acordes
                      </Button>
                      {fromCorrection && (
                        <Button variant="ghost" size="sm" className="gap-2" onClick={handleResetCorrection} disabled={savingCorrection}>
                          <RotateCcw className="w-4 h-4" /> Restaurar IA
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button variant="default" size="sm" className="gap-2" onClick={handleSaveCorrection} disabled={savingCorrection}>
                        {savingCorrection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Guardar corrección
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => { setAnalysis(originalAnalysis); setEditMode(false); }}>
                        <X className="w-4 h-4" /> Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Pro Actions */}
              {!editMode && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {isPro ? (
                    <>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF} disabled={exporting !== null}>
                        {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        Exportar PDF
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPNG} disabled={exporting !== null}>
                        {exporting === 'png' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
                        Exportar imagen
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleSaveToLibrary} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar en Biblioteca
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
                      <Crown className="w-3 h-3" />
                      Exportar PDF/imagen y guardar en biblioteca disponible en Pro
                    </div>
                  )}
                </div>
              )}

              {/* Song Info Header */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="pt-4 space-y-3">
                  {editMode ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Título</label>
                        <Input value={analysis.songTitle} onChange={(e) => updateField('songTitle', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Artista</label>
                        <Input value={analysis.artist} onChange={(e) => updateField('artist', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Tonalidad</label>
                        <Input value={analysis.key} onChange={(e) => updateField('key', e.target.value)} placeholder="Ej: Do Mayor" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Tempo</label>
                        <Input value={analysis.tempo} onChange={(e) => updateField('tempo', e.target.value)} placeholder="120 BPM" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Compás</label>
                        <Input value={analysis.timeSignature} onChange={(e) => updateField('timeSignature', e.target.value)} placeholder="4/4" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Dificultad</label>
                        <Input value={analysis.difficulty} onChange={(e) => updateField('difficulty', e.target.value)} placeholder="Fácil / Intermedio / Avanzado" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="text-xl font-bold">{analysis.songTitle}</h3>
                        <p className="text-muted-foreground">{analysis.artist}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">🎵 Tonalidad: {analysis.key}</Badge>
                        <Badge variant="secondary" className="gap-1">⏱️ {analysis.tempo}</Badge>
                        <Badge variant="secondary" className="gap-1">📊 {analysis.timeSignature}</Badge>
                        <Badge variant={analysis.difficulty === 'Fácil' ? 'default' : analysis.difficulty === 'Intermedio' ? 'secondary' : 'destructive'}>
                          {analysis.difficulty}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chords Used */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListMusic className="w-4 h-4" />
                    Acordes Utilizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <Input
                      value={analysis.chords.join(', ')}
                      onChange={(e) => updateField('chords', e.target.value.split(',').map(c => c.trim()).filter(Boolean))}
                      placeholder="C, G, Am, F"
                      className="font-mono"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analysis.chords.map((chord, i) => (
                        <Badge key={i} variant="outline" className="text-lg px-3 py-1 font-mono">{chord}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chord Progression */}
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Progresión Armónica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {editMode ? (
                    <div className="space-y-2">
                      <Input value={analysis.progression.name} onChange={(e) => updateProgression('name', e.target.value)} placeholder="Nombre de la progresión" />
                      <Input value={analysis.progression.numerals} onChange={(e) => updateProgression('numerals', e.target.value)} placeholder="I - V - vi - IV" className="font-mono" />
                      <Textarea value={analysis.progression.description} onChange={(e) => updateProgression('description', e.target.value)} placeholder="Descripción" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge className="text-base px-3 py-1">{analysis.progression.name}</Badge>
                        <span className="font-mono text-lg text-primary">{analysis.progression.numerals}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{analysis.progression.description}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Song Structure */}
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Estructura de la Canción
                  </CardTitle>
                  {editMode && (
                    <Button variant="ghost" size="sm" className="gap-1" onClick={addSection}>
                      <Plus className="w-3 h-3" /> Sección
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.structure.map((section, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                        {editMode ? (
                          <div className="flex-1 grid grid-cols-12 gap-2 items-start">
                            <Input
                              className="col-span-3"
                              value={section.section}
                              onChange={(e) => updateSection(i, 'section', e.target.value)}
                            />
                            <Input
                              className="col-span-7 font-mono"
                              value={section.chords.join(' ')}
                              onChange={(e) => updateSection(i, 'chords', e.target.value.split(/\s+/).filter(Boolean))}
                              placeholder="C G Am F"
                            />
                            <Input
                              type="number"
                              className="col-span-1"
                              value={section.bars}
                              onChange={(e) => updateSection(i, 'bars', parseInt(e.target.value) || 0)}
                            />
                            <Button variant="ghost" size="icon" className="col-span-1" onClick={() => removeSection(i)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Badge variant="outline" className="min-w-[80px] justify-center">{section.section}</Badge>
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-1">
                                {section.chords.map((chord, j) => (
                                  <span key={j} className="font-mono text-primary">
                                    {chord}{j < section.chords.length - 1 && ' → '}
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">{section.bars} compases</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              {!editMode && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">💡 Consejos para Tocarla</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analysis.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Similar Songs */}
              {!editMode && analysis.similarSongs && analysis.similarSongs.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">🎸 Canciones con Progresión Similar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.similarSongs.map((song, i) => (
                        <Badge key={i} variant="secondary">{song}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Hoja imprimible fuera de pantalla para exportar PDF/PNG */}
      {analysis && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            pointerEvents: 'none',
            opacity: 0,
          }}
        >
          <ChordSheet ref={sheetRef} analysis={analysis} />
        </div>
      )}
    </Dialog>
  );
};
