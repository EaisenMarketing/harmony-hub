import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Guitar, Piano } from 'lucide-react';

interface ScaleInfo {
  name: string;
  notes: string[];
  description: string;
  mode: string;
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
      { name: 'Escala Mayor (Jónica)', notes: ['C','D','E','F','G','A','B'], description: 'La escala base. Sonido brillante y feliz.', mode: 'Jónico' },
      { name: 'Pentatónica Mayor', notes: ['C','D','E','G','A'], description: 'Versión simplificada de la mayor. Ideal para improvisar sobre acordes mayores.', mode: 'Pentatónica' },
      { name: 'Mixolidio (sobre G)', notes: ['G','A','B','C','D','E','F'], description: 'Modo dominante. Suena bluesy sobre el V grado.', mode: 'Mixolidio' },
    ],
    tips: 'Practica alternando entre la pentatónica mayor y la escala mayor completa. En el acorde G, prueba el modo Mixolidio para un color diferente.',
  },
  {
    name: 'I - V - vi - IV',
    genre: 'Pop / Rock moderno',
    chords: ['C', 'G', 'Am', 'F'],
    key: 'C Mayor',
    scales: [
      { name: 'Escala Mayor (Jónica)', notes: ['C','D','E','F','G','A','B'], description: 'Funciona sobre toda la progresión.', mode: 'Jónico' },
      { name: 'Pentatónica Menor (sobre Am)', notes: ['A','C','D','E','G'], description: 'Añade emotividad sobre el vi grado (Am).', mode: 'Pentatónica Menor' },
      { name: 'Eólico (Am)', notes: ['A','B','C','D','E','F','G'], description: 'Modo menor natural. Ideal para solos melancólicos.', mode: 'Eólico' },
    ],
    tips: 'Esta es la progresión más popular del pop. Puedes usar la mayor sobre todo, o cambiar a pentatónica menor en el Am para más emoción.',
  },
  {
    name: 'ii - V - I (Jazz)',
    genre: 'Jazz / Bossa Nova',
    chords: ['Dm7', 'G7', 'Cmaj7'],
    key: 'C Mayor',
    scales: [
      { name: 'Dórico (sobre Dm7)', notes: ['D','E','F','G','A','B','C'], description: 'El modo favorito del jazz sobre acordes menores.', mode: 'Dórico' },
      { name: 'Mixolidio (sobre G7)', notes: ['G','A','B','C','D','E','F'], description: 'Modo dominante. Esencial para el V7.', mode: 'Mixolidio' },
      { name: 'Jónico (sobre Cmaj7)', notes: ['C','D','E','F','G','A','B'], description: 'Resolución al modo mayor.', mode: 'Jónico' },
      { name: 'Escala Bebop Dominante', notes: ['G','A','B','C','D','E','F','F#'], description: 'Agrega la 7ma mayor como nota de paso para líneas cromáticas.', mode: 'Bebop' },
    ],
    tips: 'Practica cambiando de escala con cada acorde. En jazz, cada acorde tiene su propia escala. El Dórico sobre ii, Mixolidio sobre V, Jónico sobre I.',
  },
  {
    name: 'i - iv - v (Menor)',
    genre: 'Rock / Metal / Flamenco',
    chords: ['Am', 'Dm', 'Em'],
    key: 'A Menor',
    scales: [
      { name: 'Menor Natural (Eólica)', notes: ['A','B','C','D','E','F','G'], description: 'Base del modo menor. Sonido oscuro y dramático.', mode: 'Eólico' },
      { name: 'Pentatónica Menor', notes: ['A','C','D','E','G'], description: 'La escala más usada en rock y blues.', mode: 'Pentatónica Menor' },
      { name: 'Menor Armónica', notes: ['A','B','C','D','E','F','G#'], description: 'Añade tensión con el 7mo grado elevado. Sonido exótico/clásico.', mode: 'Menor Armónica' },
      { name: 'Frigio', notes: ['E','F','G','A','B','C','D'], description: 'Modo español/flamenco. Sobre el Em suena muy étnico.', mode: 'Frigio' },
    ],
    tips: 'La pentatónica menor es tu base. Añade la nota blue (Eb/D#) para blues. Prueba la menor armónica para momentos de tensión y el Frigio sobre Em para un sonido flamenco.',
  },
  {
    name: 'I - vi - IV - V (50s)',
    genre: 'Doo-wop / Pop clásico',
    chords: ['C', 'Am', 'F', 'G'],
    key: 'C Mayor',
    scales: [
      { name: 'Escala Mayor', notes: ['C','D','E','F','G','A','B'], description: 'Funciona perfecto sobre toda la progresión.', mode: 'Jónico' },
      { name: 'Pentatónica Mayor', notes: ['C','D','E','G','A'], description: 'Simplifica la improvisación manteniendo el color mayor.', mode: 'Pentatónica' },
      { name: 'Blues Mayor', notes: ['C','D','Eb','E','G','A'], description: 'Añade la blue note para un toque soul.', mode: 'Blues' },
    ],
    tips: 'Progresión clásica de los 50s. Ideal para practicar melodías vocales y solos melódicos con la escala mayor.',
  },
  {
    name: 'i - bVII - bVI - V (Andaluza)',
    genre: 'Flamenco / Español / Metal',
    chords: ['Am', 'G', 'F', 'E'],
    key: 'A Frigio',
    scales: [
      { name: 'Frigio', notes: ['A','Bb','C','D','E','F','G'], description: 'El modo de esta progresión. Sonido español por excelencia.', mode: 'Frigio' },
      { name: 'Frigio Dominante', notes: ['A','Bb','C#','D','E','F','G'], description: 'Variación con 3ra mayor. Sonido árabe/flamenco más intenso.', mode: 'Frigio Dominante' },
      { name: 'Menor Armónica', notes: ['A','B','C','D','E','F','G#'], description: 'Añade tensión sobre el acorde E (dominante).', mode: 'Menor Armónica' },
    ],
    tips: 'Esta es la cadencia andaluza. El modo Frigio es esencial aquí. Sobre el acorde E, prueba el Frigio Dominante para un sonido más auténtico.',
  },
  {
    name: 'I - bVII - IV (Rock Modal)',
    genre: 'Rock / Grunge',
    chords: ['A', 'G', 'D'],
    key: 'A Mixolidio',
    scales: [
      { name: 'Mixolidio', notes: ['A','B','C#','D','E','F#','G'], description: 'Modo dominante. El sonido del rock clásico.', mode: 'Mixolidio' },
      { name: 'Pentatónica Mayor', notes: ['A','B','C#','E','F#'], description: 'Para solos melódicos y riffs.', mode: 'Pentatónica' },
      { name: 'Blues', notes: ['A','C','D','Eb','E','G'], description: 'Mezcla de pentatónica menor con blue note.', mode: 'Blues' },
    ],
    tips: 'Progresión modal muy usada en rock. El Mixolidio da ese sonido "relajado" del rock. Mezcla pentatónica mayor y menor para solos interesantes.',
  },
  {
    name: 'vi - IV - I - V',
    genre: 'Pop Emotivo / Indie',
    chords: ['Am', 'F', 'C', 'G'],
    key: 'C Mayor / A Menor',
    scales: [
      { name: 'Eólico (Am)', notes: ['A','B','C','D','E','F','G'], description: 'Perfecto para el inicio emotivo.', mode: 'Eólico' },
      { name: 'Jónico (C)', notes: ['C','D','E','F','G','A','B'], description: 'Para la resolución esperanzadora.', mode: 'Jónico' },
      { name: 'Pentatónica Menor', notes: ['A','C','D','E','G'], description: 'Base segura para improvisar.', mode: 'Pentatónica Menor' },
      { name: 'Lidio (sobre F)', notes: ['F','G','A','B','C','D','E'], description: 'Modo con #4. Suena etéreo y soñador.', mode: 'Lidio' },
    ],
    tips: 'Mismas notas que I-V-vi-IV pero empezando por el relativo menor. Comienza con Eólico/pentatónica menor y resuelve a mayor. Prueba Lidio sobre F para momentos mágicos.',
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
  'Jónico': 'Todas teclas blancas en C. Practica con ambas manos, digitación 1-2-3-1-2-3-4-5.',
  'Dórico': 'En D: todas teclas blancas. Siente la diferencia con el Eólico (6ta mayor vs menor).',
  'Frigio': 'En E: todas teclas blancas. El b2 le da un color único. Mano izquierda: acordes.',
  'Lidio': 'En F: todas teclas blancas. El #4 (B natural) es la nota mágica.',
  'Mixolidio': 'En G: todas teclas blancas. Suena como una mayor "relajada" por el b7.',
  'Eólico': 'En A: todas teclas blancas. La escala menor natural más fácil de visualizar.',
  'Pentatónica': 'Las 5 teclas negras forman una pentatónica. Improvisa solo con teclas negras.',
  'Pentatónica Menor': 'En Am: A, C, D, E, G. Practica patrones de 3 notas ascendentes.',
  'Blues': 'Añade Eb entre D y E en Am. Mano izquierda: bajo con octavas.',
  'Menor Armónica': 'Como menor natural pero con G# en Am. Sonido "clásico" y tenso.',
  'Frigio Dominante': 'Escala exótica. Practica con mano derecha mientras la izquierda sostiene la tónica.',
  'Bebop': 'Practica en corcheas constantes. La nota extra te permite aterrizar en tiempos fuertes.',
};

export const ChordProgressions = () => {
  const [selectedProg, setSelectedProg] = useState(0);
  const [instrument, setInstrument] = useState<'guitar' | 'piano'>('guitar');

  const prog = PROGRESSIONS[selectedProg];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">🎵 Progresiones de Acordes, Escalas y Modos</h2>

      {/* Instrument toggle */}
      <div className="flex items-center gap-3">
        <Button
          variant={instrument === 'guitar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInstrument('guitar')}
          className="gap-2"
        >
          <Guitar className="w-4 h-4" /> Guitarra
        </Button>
        <Button
          variant={instrument === 'piano' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInstrument('piano')}
          className="gap-2"
        >
          <Piano className="w-4 h-4" /> Piano
        </Button>
      </div>

      {/* Progression selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {PROGRESSIONS.map((p, i) => (
          <Button
            key={i}
            variant={selectedProg === i ? 'default' : 'outline'}
            size="sm"
            className="h-auto py-2 text-left flex flex-col items-start"
            onClick={() => setSelectedProg(i)}
          >
            <span className="font-semibold text-xs">{p.name}</span>
            <span className="text-[10px] opacity-70">{p.genre}</span>
          </Button>
        ))}
      </div>

      {/* Selected progression details */}
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
          {/* Chord display */}
          <div className="flex gap-3 flex-wrap">
            {prog.chords.map((chord, i) => (
              <div key={i} className="bg-primary/10 rounded-xl px-6 py-4 text-center min-w-[80px]">
                <p className="text-2xl font-bold text-primary">{chord}</p>
              </div>
            ))}
          </div>

          {/* Scales & Modes */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Escalas y Modos Compatibles
            </h3>
            <div className="space-y-3">
              {prog.scales.map((scale, i) => (
                <Card key={i} className="border-border/30">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-semibold text-foreground">{scale.name}</h4>
                      <Badge variant="outline" className="text-xs">{scale.mode}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{scale.description}</p>
                    
                    {/* Notes display */}
                    <div className="flex gap-1.5 flex-wrap">
                      {scale.notes.map((note, j) => (
                        <span key={j} className="bg-muted px-2.5 py-1 rounded-md text-sm font-mono font-medium text-foreground">
                          {note}
                        </span>
                      ))}
                    </div>

                    {/* Instrument-specific tips */}
                    <div className="bg-muted/50 rounded-lg p-3 mt-2">
                      <p className="text-xs text-muted-foreground">
                        {instrument === 'guitar' ? '🎸 ' : '🎹 '}
                        <span className="font-medium text-foreground">
                          {instrument === 'guitar' 
                            ? (GUITAR_POSITIONS[scale.mode] || 'Practica esta escala en diferentes posiciones del mástil.')
                            : (PIANO_TIPS[scale.mode] || 'Practica con ambas manos por separado, luego juntas.')}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Practice tips */}
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <h4 className="font-semibold text-foreground mb-1">💡 Consejos de Práctica</h4>
            <p className="text-sm text-muted-foreground">{prog.tips}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
