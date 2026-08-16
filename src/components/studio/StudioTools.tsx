import { Card } from '@/components/ui/card';
import { PracticeCoachModal } from '@/components/student/PracticeCoachModal';
import { EarTrainerModal } from '@/components/student/EarTrainerModal';
import { MetronomeTunerModal } from '@/components/student/MetronomeTunerModal';
import { ChordCreatorModal } from '@/components/student/ChordCreatorModal';
import type { TeacherAccount } from '@/hooks/useTeacherStudio';
import type { InstrumentSlug } from '@/lib/instrument-access';
import { isValidInstrument } from '@/lib/instrument-access';

export const StudioTools = ({ account }: { account: TeacherAccount }) => {
  const instrument: InstrumentSlug = isValidInstrument(account.primary_instrument)
    ? account.primary_instrument
    : 'guitar';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Herramientas de Acorde Live</h2>
        <p className="text-xs text-muted-foreground">
          Úsalas en tus clases y pídeselas a tus alumnos como tarea.
        </p>
      </div>

      <Card className="p-4 bg-card/70 border-white/10">
        <div className="flex flex-wrap gap-2">
          <PracticeCoachModal />
          <EarTrainerModal />
          <MetronomeTunerModal />
          <ChordCreatorModal userInstrument={instrument} />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/portal/partituras">
              <FileMusic className="w-4 h-4" />
              Creador de Partituras
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
};
