import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Music, Guitar, Piano, Plus, Save, Trash2, X, Bookmark } from 'lucide-react';
import { GuitarFretboardDiagram } from './GuitarFretboardDiagram';
import { ScalePianoKeyboard } from './ScalePianoKeyboard';
import { GuitarAudioEngine } from './GuitarAudioEngine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
interface ScaleInfo {
  name: string;
  notes: string[];
  description: string;
  mode: string;
  root?: string;
}

interface ChordProg {
  name: string;
  genre: string;
  chords: string[];
  key: string;
  scales: ScaleInfo[];
  tips: string;
}

const PROGRESSIONS: ChordProg[] = [
  {
    name: 'I - IV - V - I (Clásica)',
    genre: 'Rock / Pop / Folk',
    chords: ['C', 'F', 'G', 'C'],
    key: 'C Mayor',
    scales: [
      { name: 'Escala Mayor (Jónica)', notes: ['C','D','E','F','G','A','B'], description: 'La escala base. Sonido brillante y feliz.', mode: 'Jónico', root: 'C' },
      { name: 'Pentatónica Mayor', notes: ['C','D','E','G','A'], description: 'Versión simplificada. Ideal para improvisar.', mode: 'Pentatónica', root: 'C' },
      { name: 'Mixolidio (sobre G)', notes: ['G','A','B','C','D','E','F'], description: 'Modo dominante. Suena bluesy sobre el V grado.', mode: 'Mixolidio', root: 'G' },
    ],
    tips: 'Practica alternando entre la pentatónica mayor y la escala mayor completa. En el acorde G, prueba el modo Mixolidio.',
  },
  {
    name: 'I - V - vi - IV',
    genre: 'Pop / Rock moderno',
    chords: ['C', 'G', 'Am', 'F'],
    key: 'C Mayor',
    scales: [
      { name: 'Escala Mayor (Jónica)', notes: ['C','D','E','F','G','A','B'], description: 'Funciona sobre toda la progresión.', mode: 'Jónico', root: 'C' },
      { name: 'Pentatónica Menor (sobre Am)', notes: ['A','C','D','E','G'], description: 'Añade emotividad sobre el vi grado.', mode: 'Pentatónica Menor', root: 'A' },
      { name: 'Eólico (Am)', notes: ['A','B','C','D','E','F','G'], description: 'Modo menor natural. Ideal para solos melancólicos.', mode: 'Eólico', root: 'A' },
    ],
    tips: 'La progresión más popular del pop. Usa la mayor sobre todo, o cambia a pentatónica menor en el Am.',
  },
  {
    name: 'ii - V - I (Jazz)',
    genre: 'Jazz / Bossa Nova',
    chords: ['Dm7', 'G7', 'Cmaj7'],
    key: 'C Mayor',
    scales: [
      { name: 'Dórico (sobre Dm7)', notes: ['D','E','F','G','A','B','C'], description: 'El modo favorito del jazz sobre acordes menores.', mode: 'Dórico', root: 'D' },
      { name: 'Mixolidio (sobre G7)', notes: ['G','A','B','C','D','E','F'], description: 'Modo dominante. Esencial para el V7.', mode: 'Mixolidio', root: 'G' },
      { name: 'Jónico (sobre Cmaj7)', notes: ['C','D','E','F','G','A','B'], description: 'Resolución al modo mayor.', mode: 'Jónico', root: 'C' },
      { name: 'Bebop Dominante', notes: ['G','A','B','C','D','E','F','F#'], description: 'Agrega la 7ma mayor como nota de paso cromática.', mode: 'Bebop', root: 'G' },
    ],
    tips: 'Practica cambiando de escala con cada acorde. Dórico sobre ii, Mixolidio sobre V, Jónico sobre I.',
  },
  {
    name: 'i - iv - v (Menor)',
    genre: 'Rock / Metal / Flamenco',
    chords: ['Am', 'Dm', 'Em'],
    key: 'A Menor',
    scales: [
      { name: 'Menor Natural (Eólica)', notes: ['A','B','C','D','E','F','G'], description: 'Sonido oscuro y dramático.', mode: 'Eólico', root: 'A' },
      { name: 'Pentatónica Menor', notes: ['A','C','D','E','G'], description: 'La más usada en rock y blues.', mode: 'Pentatónica Menor', root: 'A' },
      { name: 'Menor Armónica', notes: ['A','B','C','D','E','F','G#'], description: 'Añade tensión con el 7mo grado elevado.', mode: 'Menor Armónica', root: 'A' },
      { name: 'Frigio (sobre Em)', notes: ['E','F','G','A','B','C','D'], description: 'Sonido español/flamenco.', mode: 'Frigio', root: 'E' },
    ],
    tips: 'La pentatónica menor es tu base. Añade la nota blue (Eb) para blues. Prueba el Frigio sobre Em.',
  },
  {
    name: 'I - vi - IV - V (50s)',
    genre: 'Doo-wop / Pop clásico',
    chords: ['C', 'Am', 'F', 'G'],
    key: 'C Mayor',
    scales: [
      { name: 'Escala Mayor', notes: ['C','D','E','F','G','A','B'], description: 'Funciona perfecto.', mode: 'Jónico', root: 'C' },
      { name: 'Pentatónica Mayor', notes: ['C','D','E','G','A'], description: 'Simplifica la improvisación.', mode: 'Pentatónica', root: 'C' },
      { name: 'Blues Mayor', notes: ['C','D','Eb','E','G','A'], description: 'Añade la blue note para toque soul.', mode: 'Blues', root: 'C' },
    ],
    tips: 'Progresión clásica de los 50s. Ideal para melodías vocales y solos melódicos.',
  },
  {
    name: 'i - bVII - bVI - V (Andaluza)',
    genre: 'Flamenco / Español / Metal',
    chords: ['Am', 'G', 'F', 'E'],
    key: 'A Frigio',
    scales: [
      { name: 'Frigio', notes: ['A','Bb','C','D','E','F','G'], description: 'Sonido español por excelencia.', mode: 'Frigio', root: 'A' },
      { name: 'Frigio Dominante', notes: ['A','Bb','C#','D','E','F','G'], description: 'Sonido árabe/flamenco más intenso.', mode: 'Frigio Dominante', root: 'A' },
      { name: 'Menor Armónica', notes: ['A','B','C','D','E','F','G#'], description: 'Tensión sobre el acorde E.', mode: 'Menor Armónica', root: 'A' },
    ],
    tips: 'Cadencia andaluza. El modo Frigio es esencial. Sobre E, prueba Frigio Dominante.',
  },
  {
    name: 'I - bVII - IV (Rock Modal)',
    genre: 'Rock / Grunge',
    chords: ['A', 'G', 'D'],
    key: 'A Mixolidio',
    scales: [
      { name: 'Mixolidio', notes: ['A','B','C#','D','E','F#','G'], description: 'El sonido del rock clásico.', mode: 'Mixolidio', root: 'A' },
      { name: 'Pentatónica Mayor', notes: ['A','B','C#','E','F#'], description: 'Para solos melódicos y riffs.', mode: 'Pentatónica', root: 'A' },
      { name: 'Blues', notes: ['A','C','D','Eb','E','G'], description: 'Mezcla pentatónica menor con blue note.', mode: 'Blues', root: 'A' },
    ],
    tips: 'Progresión modal. El Mixolidio da el sonido "relajado" del rock.',
  },
  {
    name: 'vi - IV - I - V',
    genre: 'Pop Emotivo / Indie',
    chords: ['Am', 'F', 'C', 'G'],
    key: 'C Mayor / A Menor',
    scales: [
      { name: 'Eólico (Am)', notes: ['A','B','C','D','E','F','G'], description: 'Para el inicio emotivo.', mode: 'Eólico', root: 'A' },
      { name: 'Jónico (C)', notes: ['C','D','E','F','G','A','B'], description: 'Para la resolución esperanzadora.', mode: 'Jónico', root: 'C' },
      { name: 'Pentatónica Menor', notes: ['A','C','D','E','G'], description: 'Base segura para improvisar.', mode: 'Pentatónica Menor', root: 'A' },
      { name: 'Lidio (sobre F)', notes: ['F','G','A','B','C','D','E'], description: 'Suena etéreo y soñador.', mode: 'Lidio', root: 'F' },
    ],
    tips: 'Comienza con Eólico/pentatónica menor y resuelve a mayor. Prueba Lidio sobre F.',
  },
  // ===== NEW PROGRESSIONS =====
  {
    name: 'I - IV - vi - V',
    genre: 'Pop / Country',
    chords: ['G', 'C', 'Em', 'D'],
    key: 'G Mayor',
    scales: [
      { name: 'Escala Mayor (G)', notes: ['G','A','B','C','D','E','F#'], description: 'Base mayor sobre toda la progresión.', mode: 'Jónico', root: 'G' },
      { name: 'Pentatónica Mayor (G)', notes: ['G','A','B','D','E'], description: 'Ideal para solos country y folk.', mode: 'Pentatónica', root: 'G' },
      { name: 'Eólico (Em)', notes: ['E','F#','G','A','B','C','D'], description: 'Sobre el vi grado para color emotivo.', mode: 'Eólico', root: 'E' },
    ],
    tips: 'Progresión muy usada en country y pop. La pentatónica mayor de G funciona sobre todo.',
  },
  {
    name: 'i - bIII - bVII - IV (Épica)',
    genre: 'Cinematic / Epic Rock',
    chords: ['Am', 'C', 'G', 'D'],
    key: 'A Menor',
    scales: [
      { name: 'Menor Natural', notes: ['A','B','C','D','E','F','G'], description: 'Base menor dramática.', mode: 'Eólico', root: 'A' },
      { name: 'Dórico', notes: ['A','B','C','D','E','F#','G'], description: 'El 6to grado mayor añade luminosidad.', mode: 'Dórico', root: 'A' },
      { name: 'Pentatónica Menor', notes: ['A','C','D','E','G'], description: 'Perfecta para melodías épicas.', mode: 'Pentatónica Menor', root: 'A' },
    ],
    tips: 'Progresión épica. Mezcla Eólico y Dórico para variar entre oscuro y luminoso.',
  },
  {
    name: 'I - iii - IV - V',
    genre: 'Pop / Balada',
    chords: ['D', 'F#m', 'G', 'A'],
    key: 'D Mayor',
    scales: [
      { name: 'Escala Mayor (D)', notes: ['D','E','F#','G','A','B','C#'], description: 'Funciona sobre toda la progresión.', mode: 'Jónico', root: 'D' },
      { name: 'Pentatónica Mayor (D)', notes: ['D','E','F#','A','B'], description: 'Para melodías sencillas y dulces.', mode: 'Pentatónica', root: 'D' },
      { name: 'Frigio (F#m)', notes: ['F#','G','A','B','C#','D','E'], description: 'Color misterioso sobre el iii grado.', mode: 'Frigio', root: 'F#' },
    ],
    tips: 'Progresión suave para baladas. El iii grado (F#m) añade misterio. Usa Frigio sobre él.',
  },
  {
    name: 'i - v - bVI - bVII (Rock Menor)',
    genre: 'Hard Rock / Alt Rock',
    chords: ['Em', 'Bm', 'C', 'D'],
    key: 'E Menor',
    scales: [
      { name: 'Menor Natural (E)', notes: ['E','F#','G','A','B','C','D'], description: 'Base del rock menor.', mode: 'Eólico', root: 'E' },
      { name: 'Pentatónica Menor (E)', notes: ['E','G','A','B','D'], description: 'Esencial para riffs y solos.', mode: 'Pentatónica Menor', root: 'E' },
      { name: 'Blues (E)', notes: ['E','G','A','Bb','B','D'], description: 'Añade la blue note para más agresividad.', mode: 'Blues', root: 'E' },
      { name: 'Dórico (E)', notes: ['E','F#','G','A','B','C#','D'], description: 'Con C# para un sonido más luminoso.', mode: 'Dórico', root: 'E' },
    ],
    tips: 'Pentatónica menor de E es la base. La blue note (Bb) añade carácter. Mezcla con Dórico.',
  },
  {
    name: 'I - V - IV - V (Blues 12)',
    genre: 'Blues / R&B',
    chords: ['A', 'E', 'D', 'E'],
    key: 'A Mayor/Blues',
    scales: [
      { name: 'Pentatónica Menor (A)', notes: ['A','C','D','E','G'], description: 'La escala clásica del blues.', mode: 'Pentatónica Menor', root: 'A' },
      { name: 'Blues (A)', notes: ['A','C','D','Eb','E','G'], description: 'Pentatónica + blue note. El sonido del blues.', mode: 'Blues', root: 'A' },
      { name: 'Mixolidio (A)', notes: ['A','B','C#','D','E','F#','G'], description: 'Mezcla mayor/menor sobre acordes dominantes.', mode: 'Mixolidio', root: 'A' },
    ],
    tips: 'Mezcla pentatónica menor y mayor (Mixolidio) para el clásico sonido blues. Los bends son clave.',
  },
  {
    name: 'i - bVI - bIII - bVII (Reggae/Ska)',
    genre: 'Reggae / Ska',
    chords: ['Am', 'F', 'C', 'G'],
    key: 'A Menor',
    scales: [
      { name: 'Menor Natural', notes: ['A','B','C','D','E','F','G'], description: 'Base para reggae melódico.', mode: 'Eólico', root: 'A' },
      { name: 'Pentatónica Menor', notes: ['A','C','D','E','G'], description: 'Para melodías y solos sencillos.', mode: 'Pentatónica Menor', root: 'A' },
      { name: 'Dórico', notes: ['A','B','C','D','E','F#','G'], description: 'El F# añade el color jamaicano.', mode: 'Dórico', root: 'A' },
    ],
    tips: 'El ritmo off-beat es clave en reggae. Usa Dórico para un color más auténtico.',
  },
  {
    name: 'I - IV - I - V (Country)',
    genre: 'Country / Bluegrass',
    chords: ['G', 'C', 'G', 'D'],
    key: 'G Mayor',
    scales: [
      { name: 'Escala Mayor (G)', notes: ['G','A','B','C','D','E','F#'], description: 'La base del country.', mode: 'Jónico', root: 'G' },
      { name: 'Pentatónica Mayor (G)', notes: ['G','A','B','D','E'], description: 'Para chicken picking y solos country.', mode: 'Pentatónica', root: 'G' },
      { name: 'Mixolidio (G)', notes: ['G','A','B','C','D','E','F'], description: 'Sonido "twangy" con b7.', mode: 'Mixolidio', root: 'G' },
    ],
    tips: 'Pentatónica mayor con bends y slides. Mixolidio para solos con sabor country.',
  },
  {
    name: 'i - bVII - bVI - bVII (Power Ballad)',
    genre: 'Rock / Power Ballad',
    chords: ['Cm', 'Bb', 'Ab', 'Bb'],
    key: 'C Menor',
    scales: [
      { name: 'Menor Natural (C)', notes: ['C','D','Eb','F','G','Ab','Bb'], description: 'Emotiva y dramática.', mode: 'Eólico', root: 'C' },
      { name: 'Pentatónica Menor (C)', notes: ['C','Eb','F','G','Bb'], description: 'Para solos poderosos y emotivos.', mode: 'Pentatónica Menor', root: 'C' },
      { name: 'Menor Armónica (C)', notes: ['C','D','Eb','F','G','Ab','B'], description: 'La 7ma mayor (B) crea tensión dramática.', mode: 'Menor Armónica', root: 'C' },
    ],
    tips: 'Progresión dramática de power ballads. Menor armónica para los clímax emocionales.',
  },
];

const GUITAR_POSITIONS: Record<string, string> = {
  'Jónico': 'Posición 1: 5to traste (patrón CAGED "La"). Posición 2: 8vo traste (patrón "Mi").',
  'Dórico': 'Posición 1: 5to traste (mismo patrón que menor natural pero con 6ta mayor). Posición 2: 10mo traste.',
  'Frigio': 'Posición 1: 5to traste. Nota característica: b2 (un semitono desde la raíz).',
  'Lidio': 'Posición 1: Similar a mayor pero con #4. Busca esa nota alterada.',
  'Mixolidio': 'Posición 1: Similar a mayor pero con b7. 5to traste patrón "La".',
  'Eólico': 'Posición 1: 5to traste patrón menor. La posición más conocida de pentatónica menor.',
  'Pentatónica': 'Las 5 posiciones CAGED. Empieza por la posición 1 (patrón "Mi menor").',
  'Pentatónica Menor': 'Las 5 posiciones CAGED. Posición 1 es la más icónica del rock.',
  'Blues': 'Pentatónica menor + blue note (b5). Añade bends en la b3 y b7.',
  'Menor Armónica': 'Como la menor natural pero sube el 7mo grado un semitono.',
  'Frigio Dominante': '5to modo de la menor armónica. Patrón desde la raíz con b2 y 3ra mayor.',
  'Bebop': 'Agrega notas cromáticas de paso. Practica en corcheas constantes.',
};

const PIANO_TIPS: Record<string, string> = {
  'Jónico': 'Todas teclas blancas en C. Digitación 1-2-3-1-2-3-4-5.',
  'Dórico': 'En D: todas teclas blancas. Siente la diferencia con Eólico (6ta mayor vs menor).',
  'Frigio': 'En E: todas teclas blancas. El b2 le da un color único.',
  'Lidio': 'En F: todas teclas blancas. El #4 (B natural) es la nota mágica.',
  'Mixolidio': 'En G: todas teclas blancas. Suena como mayor "relajada" por el b7.',
  'Eólico': 'En A: todas teclas blancas. La menor natural más fácil.',
  'Pentatónica': 'Las 5 teclas negras forman una pentatónica. Improvisa con ellas.',
  'Pentatónica Menor': 'En Am: A, C, D, E, G. Patrones de 3 notas ascendentes.',
  'Blues': 'Añade Eb entre D y E en Am. Mano izquierda: octavas.',
  'Menor Armónica': 'Como menor natural pero con G# en Am. Sonido "clásico".',
  'Frigio Dominante': 'Escala exótica. Mano derecha melódica, izquierda sostiene tónica.',
  'Bebop': 'Practica en corcheas. La nota extra aterriza en tiempos fuertes.',
};

const AVAILABLE_CHORDS = [
  'C','Cm','C7','Cmaj7','Cm7','Csus2','Csus4','Cadd9',
  'D','Dm','D7','Dmaj7','Dm7','Dsus2','Dsus4','Dadd9',
  'E','Em','E7','Emaj7','Em7','Esus2','Esus4','Eadd9',
  'F','Fm','F7','Fmaj7','Fm7',
  'G','Gm','G7','Gmaj7','Gm7','Gsus2','Gsus4','Gadd9',
  'A','Am','A7','Amaj7','Am7','Asus2','Asus4','Aadd9',
  'B','Bm','B7','Bm7',
  'Bb','Bbm','Bb7','Bbmaj7',
  'Eb','Ab',
];

interface CustomProg {
  id: string;
  name: string;
  chords: string[];
  key: string | null;
  description: string | null;
  instrument: string;
}

export const ChordProgressions = () => {
  const { user } = useAuth();
  const [selectedProg, setSelectedProg] = useState(0);
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');
  const [expandedScale, setExpandedScale] = useState<number | null>(0);
  const [tab, setTab] = useState<'presets' | 'custom'>('presets');

  // Custom progressions state
  const [customProgs, setCustomProgs] = useState<CustomProg[]>([]);
  const [selectedCustom, setSelectedCustom] = useState<number | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [newName, setNewName] = useState('');
  const [newChords, setNewChords] = useState<string[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Load custom progressions
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('custom_progressions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setCustomProgs(data as CustomProg[]);
    };
    load();
  }, [user]);

  const saveProgression = async () => {
    if (!user || !newName.trim() || newChords.length < 2) {
      toast.error('Agrega un nombre y al menos 2 acordes');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('custom_progressions')
      .insert({
        user_id: user.id,
        name: newName.trim(),
        chords: newChords,
        key: newKey || null,
        description: newDesc || null,
        instrument,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
      return;
    }
    setCustomProgs(prev => [data as CustomProg, ...prev]);
    setNewName(''); setNewChords([]); setNewKey(''); setNewDesc('');
    setShowCreator(false);
    toast.success('Progresión guardada');
  };

  const deleteProgression = async (id: string) => {
    const { error } = await supabase.from('custom_progressions').delete().eq('id', id);
    if (!error) {
      setCustomProgs(prev => prev.filter(p => p.id !== id));
      setSelectedCustom(null);
      toast.success('Progresión eliminada');
    }
  };

  const addChord = (chord: string) => {
    if (newChords.length < 12) setNewChords(prev => [...prev, chord]);
  };

  const removeChord = (idx: number) => {
    setNewChords(prev => prev.filter((_, i) => i !== idx));
  };

  const prog = PROGRESSIONS[selectedProg];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">🎵 Progresiones de Acordes, Escalas y Modos</h2>

      {/* Instrument toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant={instrument === 'guitar' ? 'default' : 'outline'} size="sm" onClick={() => setInstrument('guitar')} className="gap-2">
          <Guitar className="w-4 h-4" /> Guitarra
        </Button>
        <Button variant={instrument === 'piano' ? 'default' : 'outline'} size="sm" onClick={() => setInstrument('piano')} className="gap-2">
          <Piano className="w-4 h-4" /> Piano
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant={tab === 'presets' ? 'default' : 'outline'} size="sm" onClick={() => setTab('presets')}>
            <Music className="w-4 h-4 mr-1" /> Presets
          </Button>
          <Button variant={tab === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => setTab('custom')}>
            <Bookmark className="w-4 h-4 mr-1" /> Mis Progresiones
          </Button>
        </div>
      </div>

      {tab === 'custom' ? (
        <div className="space-y-4">
          {/* Create new */}
          {!showCreator ? (
            <Button onClick={() => setShowCreator(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Crear Progresión
            </Button>
          ) : (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Nueva Progresión</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setShowCreator(false); setNewChords([]); }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="Nombre (ej: Mi Blues Favorito)" value={newName} onChange={e => setNewName(e.target.value)} maxLength={60} />
                  <Input placeholder="Tonalidad (ej: C Mayor)" value={newKey} onChange={e => setNewKey(e.target.value)} maxLength={20} />
                </div>
                <Textarea placeholder="Descripción o notas (opcional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} maxLength={200} rows={2} />

                {/* Selected chords */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Acordes seleccionados ({newChords.length}/12):</p>
                  <div className="flex gap-2 flex-wrap min-h-[44px] p-3 bg-muted/50 rounded-lg border border-border/50">
                    {newChords.length === 0 && <span className="text-sm text-muted-foreground">Toca los acordes de abajo para agregarlos...</span>}
                    {newChords.map((c, i) => (
                      <button key={i} onClick={() => removeChord(i)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-destructive transition-colors">
                        {c} ×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview audio */}
                {newChords.length >= 2 && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                    <GuitarAudioEngine chords={newChords} />
                  </div>
                )}

                {/* Chord picker */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Elige acordes:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {AVAILABLE_CHORDS.map(c => (
                      <button key={c} onClick={() => addChord(c)} disabled={newChords.length >= 12}
                        className="px-2 py-1 rounded text-xs font-mono font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-30">
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={saveProgression} disabled={saving || !newName.trim() || newChords.length < 2} className="gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Progresión'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Saved list */}
          {customProgs.length === 0 && !showCreator && (
            <p className="text-sm text-muted-foreground text-center py-8">Aún no tienes progresiones guardadas. ¡Crea tu primera!</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customProgs.map((cp, i) => (
              <Card key={cp.id} className={`cursor-pointer transition-all ${selectedCustom === i ? 'ring-2 ring-primary' : 'hover:border-primary/30'}`}
                onClick={() => setSelectedCustom(selectedCustom === i ? null : i)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-foreground truncate">{cp.name}</h4>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={e => { e.stopPropagation(); deleteProgression(cp.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {cp.key && <Badge variant="outline" className="text-[10px]">{cp.key}</Badge>}
                  <div className="flex gap-1 flex-wrap">
                    {cp.chords.map((c, j) => (
                      <span key={j} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">{c}</span>
                    ))}
                  </div>
                  {cp.description && <p className="text-xs text-muted-foreground line-clamp-2">{cp.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Expanded custom progression with audio */}
          {selectedCustom !== null && customProgs[selectedCustom] && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{customProgs[selectedCustom].name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GuitarAudioEngine chords={customProgs[selectedCustom].chords} />
                {customProgs[selectedCustom].description && (
                  <p className="text-sm text-muted-foreground">{customProgs[selectedCustom].description}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          {/* Progression selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PROGRESSIONS.map((p, i) => (
              <Button key={i} variant={selectedProg === i ? 'default' : 'outline'} size="sm"
                className="h-auto py-2 text-left flex flex-col items-start"
                onClick={() => { setSelectedProg(i); setExpandedScale(0); }}>
                <span className="font-semibold text-xs">{p.name}</span>
                <span className="text-[10px] opacity-70">{p.genre}</span>
              </Button>
            ))}
          </div>

          {/* Selected progression */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg">{prog.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">{prog.genre}</Badge>
                  <Badge variant="outline">Tonalidad: {prog.key}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <GuitarAudioEngine chords={prog.chords} />

              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Escalas y Modos Compatibles — toca una para ver el diagrama
                </h3>
                <div className="space-y-3">
                  {prog.scales.map((scale, i) => {
                    const isExpanded = expandedScale === i;
                    return (
                      <Card key={i} className={`border-border/30 cursor-pointer transition-all ${isExpanded ? 'ring-1 ring-primary/50' : 'hover:border-primary/30'}`}
                        onClick={() => setExpandedScale(isExpanded ? null : i)}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="font-semibold text-foreground">{scale.name}</h4>
                            <Badge variant="outline" className="text-xs">{scale.mode}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{scale.description}</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {scale.notes.map((note, j) => (
                              <span key={j} className={`px-2.5 py-1 rounded-md text-sm font-mono font-medium ${
                                note === (scale.root || scale.notes[0]) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                              }`}>{note}</span>
                            ))}
                          </div>
                          {isExpanded && (
                            <div className="pt-2">
                              {instrument === 'guitar' ? (
                                <GuitarFretboardDiagram notes={scale.notes} rootNote={scale.root} />
                              ) : (
                                <ScalePianoKeyboard notes={scale.notes} rootNote={scale.root} />
                              )}
                            </div>
                          )}
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              {instrument === 'guitar' ? '🎸 ' : '🎹 '}
                              <span className="font-medium text-foreground">
                                {instrument === 'guitar'
                                  ? (GUITAR_POSITIONS[scale.mode] || 'Practica en diferentes posiciones del mástil.')
                                  : (PIANO_TIPS[scale.mode] || 'Practica con ambas manos.')}
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <h4 className="font-semibold text-foreground mb-1">💡 Consejos de Práctica</h4>
                <p className="text-sm text-muted-foreground">{prog.tips}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
