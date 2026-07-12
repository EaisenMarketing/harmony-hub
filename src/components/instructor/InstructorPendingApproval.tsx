import { useState } from 'react';
import { Clock, Music, XCircle, Send, Guitar, Piano, Drum } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRequestInstructor, InstructorProfile } from '@/hooks/useInstructorData';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Props {
  profile: InstructorProfile | null | undefined;
}

const instrumentOptions = [
  { value: 'guitar', label: 'Guitarra', icon: Guitar },
  { value: 'piano', label: 'Piano', icon: Piano },
  { value: 'drums', label: 'Batería', icon: Drum },
];

export const InstructorPendingApproval = ({ profile }: Props) => {
  const requestInstructor = useRequestInstructor();
  const [formData, setFormData] = useState({
    instrument: '' as 'guitar' | 'piano' | 'drums' | '',
    bio: '',
    specialization: '',
    years_experience: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.instrument) {
      toast.error('Selecciona un instrumento');
      return;
    }

    try {
      await requestInstructor.mutateAsync({
        instrument: formData.instrument,
        bio: formData.bio || undefined,
        specialization: formData.specialization || undefined,
        years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
      });
      toast.success('Solicitud enviada exitosamente');
    } catch {
      toast.error('Error al enviar la solicitud');
    }
  };

  // If already has a profile, show status
  if (profile) {
    const statusConfig = {
      pending: {
        icon: Clock,
        title: 'Solicitud Pendiente',
        description: 'Tu solicitud está siendo revisada por el administrador. Te notificaremos cuando sea aprobada.',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
      },
      rejected: {
        icon: XCircle,
        title: 'Solicitud Rechazada',
        description: 'Tu solicitud fue rechazada. Contacta al administrador para más información.',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
      },
      suspended: {
        icon: XCircle,
        title: 'Cuenta Suspendida',
        description: 'Tu cuenta de instructor ha sido suspendida. Contacta al administrador.',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
      },
    };

    const status = statusConfig[profile.status as keyof typeof statusConfig];
    if (!status) return null;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="pt-8 pb-6 text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${status.bgColor} flex items-center justify-center`}>
              <status.icon className={`w-8 h-8 ${status.color}`} />
            </div>
            <h2 className="text-xl font-bold mb-2">{status.title}</h2>
            <p className="text-muted-foreground mb-6">{status.description}</p>
            <Link to="/portal">
              <Button variant="outline" className="w-full">
                Volver al Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no profile, show request form
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-border/50">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Solicitar ser Instructor</CardTitle>
          <p className="text-muted-foreground">
            Completa el formulario para solicitar acceso como instructor
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrumento que enseñas *</Label>
              <Select
                value={formData.instrument}
                onValueChange={(value) => setFormData({ ...formData, instrument: value as typeof formData.instrument })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un instrumento" />
                </SelectTrigger>
                <SelectContent>
                  {instrumentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Especialización</Label>
              <Input
                id="specialization"
                placeholder="Ej: Música clásica, Jazz, Rock..."
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="years_experience">Años de experiencia</Label>
              <Input
                id="years_experience"
                type="number"
                placeholder="Ej: 5"
                min="0"
                value={formData.years_experience}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                placeholder="Cuéntanos sobre tu experiencia musical..."
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Link to="/portal" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="flex-1 gap-2"
                disabled={requestInstructor.isPending}
              >
                <Send className="w-4 h-4" />
                {requestInstructor.isPending ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
