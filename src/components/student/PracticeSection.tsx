import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PracticeTracker } from './PracticeTracker';
import { DrumTracksPlayer } from './DrumTracksPlayer';
import { ChordProgressions } from './ChordProgressions';

export const PracticeSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">🎶 Sala de Práctica</h1>
        <p className="text-muted-foreground mt-1">
          Registra tu práctica, toca con tracks de batería y estudia progresiones con escalas.
        </p>
      </div>

      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="tracker">📊 Tracking</TabsTrigger>
          <TabsTrigger value="drums">🥁 Batería</TabsTrigger>
          <TabsTrigger value="progressions">🎵 Progresiones</TabsTrigger>
        </TabsList>
        <TabsContent value="tracker">
          <PracticeTracker />
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
