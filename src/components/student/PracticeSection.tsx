import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PracticeTracker } from './PracticeTracker';
import { DrumTracksPlayer } from './DrumTracksPlayer';
import { ChordProgressions } from './ChordProgressions';
import { RhythmExercises } from './RhythmExercises';

export const PracticeSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">🎶 Sala de Práctica</h1>
        <p className="text-muted-foreground mt-1">
          Registra tu práctica, estudia rítmica, toca con tracks de batería y progresiones.
        </p>
      </div>

      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="tracker">📊 Tracking</TabsTrigger>
          <TabsTrigger value="rhythm">🎯 Rítmica</TabsTrigger>
          <TabsTrigger value="drums">🥁 Batería</TabsTrigger>
          <TabsTrigger value="progressions">🎵 Progresiones</TabsTrigger>
        </TabsList>
        <TabsContent value="tracker">
          <PracticeTracker />
        </TabsContent>
        <TabsContent value="rhythm">
          <RhythmExercises />
        </TabsContent>
        <TabsContent value="drums">
          <DrumTracksPlayer />
        </TabsContent>
        <TabsContent value="progressions">
          <ChordProgressions />
        </TabsContent>
      </Tabs>
    </div>
  );
};
