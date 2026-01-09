import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCreateLiveClass } from '@/hooks/useAdminData';
import { useToast } from '@/hooks/use-toast';

interface LiveClassFormProps {
  open: boolean;
  onClose: () => void;
}

const instruments = [
  { value: 'guitar', label: '🎸 Guitarra' },
  { value: 'piano', label: '🎹 Piano' },
  { value: 'drums', label: '🥁 Batería' },
  { value: 'banjo', label: '🪕 Banjo' },
];

const plans = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'pro', label: 'Pro' },
];

export const LiveClassForm = ({ open, onClose }: LiveClassFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [instrument, setInstrument] = useState<string>('guitar');
  const [requiredPlan, setRequiredPlan] = useState<string>('standard');
  const [duration, setDuration] = useState('60');
  const [maxAttendees, setMaxAttendees] = useState('100');
  const [zoomUrl, setZoomUrl] = useState('');

  const createLiveClass = useCreateLiveClass();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createLiveClass.mutateAsync({
        title,
        description: description || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        instrument: instrument as 'guitar' | 'piano' | 'drums' | 'banjo',
        required_plan: requiredPlan as 'basic' | 'standard' | 'pro',
        duration_minutes: parseInt(duration) || 60,
        max_attendees: parseInt(maxAttendees) || 100,
        zoom_join_url: zoomUrl || null,
      });
      toast({ title: 'Clase en vivo creada exitosamente' });
      onClose();
    } catch (error) {
      toast({ title: 'Error al crear la clase', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Clase en Vivo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masterclass de Jazz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la clase..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled">Fecha y Hora</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Instrumento</Label>
              <Select value={instrument} onValueChange={setInstrument}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plan Requerido</Label>
              <Select value={requiredPlan} onValueChange={setRequiredPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max">Máx. Asistentes</Label>
              <Input
                id="max"
                type="number"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoom">URL de Zoom (opcional)</Label>
            <Input
              id="zoom"
              value={zoomUrl}
              onChange={(e) => setZoomUrl(e.target.value)}
              placeholder="https://zoom.us/j/..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={createLiveClass.isPending}>
              Crear Clase
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
