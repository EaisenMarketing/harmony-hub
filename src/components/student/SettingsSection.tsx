import { useState, useRef } from 'react';
import { User, Bell, Shield, Globe, Save, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudentProfile } from '@/hooks/useStudentData';
import { InstrumentSettings } from './InstrumentSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const SettingsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useStudentProfile();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('America/Mexico_City');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when profile loads
  useState(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setTimezone(profile.timezone || 'America/Mexico_City');
    }
  });

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          timezone,
        })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      toast({ title: 'Perfil actualizado', description: 'Tus cambios han sido guardados.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo actualizar el perfil.', variant: 'destructive' });
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'La imagen debe ser menor a 2MB.', variant: 'destructive' });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      toast({ title: 'Error', description: 'Solo se permiten archivos JPG, PNG o GIF.', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['student-profile'] });
      toast({ title: 'Foto actualizada', description: 'Tu foto de perfil ha sido cambiada.' });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({ title: 'Error', description: 'No se pudo subir la foto.', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu cuenta y preferencias
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="w-4 h-4 mr-2" />
            Preferencias
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Información del Perfil</CardTitle>
              <CardDescription>
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(profile?.full_name || user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mr-2" />
                    )}
                    {uploadingAvatar ? 'Subiendo...' : 'Cambiar Foto'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName || profile?.full_name || ''}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={phone || profile?.phone || ''}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select 
                    value={timezone || profile?.timezone || 'America/Mexico_City'} 
                    onValueChange={setTimezone}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
                      <SelectItem value="America/Monterrey">Monterrey</SelectItem>
                      <SelectItem value="America/Tijuana">Tijuana</SelectItem>
                      <SelectItem value="America/Cancun">Cancún</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (EST)</SelectItem>
                      <SelectItem value="America/Chicago">Chicago (CST)</SelectItem>
                      <SelectItem value="America/Denver">Denver (MST)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Los Ángeles (PST)</SelectItem>
                      <SelectItem value="America/Anchorage">Alaska</SelectItem>
                      <SelectItem value="Pacific/Honolulu">Hawái</SelectItem>
                      <SelectItem value="America/Bogota">Bogotá</SelectItem>
                      <SelectItem value="America/Lima">Lima</SelectItem>
                      <SelectItem value="America/Santiago">Santiago</SelectItem>
                      <SelectItem value="America/Buenos_Aires">Buenos Aires</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={() => updateProfile.mutate()}
                disabled={updateProfile.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6">
            <InstrumentSettings />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>
                Configura cómo y cuándo recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Recordatorios de Clases</p>
                    <p className="text-sm text-muted-foreground">
                      Recibe recordatorios antes de las clases en vivo
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nuevos Cursos</p>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones cuando se publiquen nuevos cursos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Progreso Semanal</p>
                    <p className="text-sm text-muted-foreground">
                      Resumen semanal de tu progreso
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Ofertas y Promociones</p>
                    <p className="text-sm text-muted-foreground">
                      Descuentos y ofertas especiales
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de la Aplicación</CardTitle>
              <CardDescription>
                Personaliza tu experiencia de aprendizaje
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Idioma Preferido</Label>
                  <Select defaultValue="es">
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Reproducción Automática</p>
                    <p className="text-sm text-muted-foreground">
                      Reproducir automáticamente la siguiente lección
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Subtítulos</p>
                    <p className="text-sm text-muted-foreground">
                      Mostrar subtítulos cuando estén disponibles
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad de la Cuenta</CardTitle>
              <CardDescription>
                Gestiona la seguridad de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-1">Cambiar Contraseña</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Te enviaremos un correo para restablecer tu contraseña
                  </p>
                  <Button variant="outline" size="sm">
                    Enviar Correo
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-1">Sesiones Activas</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Cierra sesión en todos los dispositivos
                  </p>
                  <Button variant="outline" size="sm">
                    Cerrar Todas las Sesiones
                  </Button>
                </div>
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-1">Eliminar Cuenta</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Esta acción es permanente y no se puede deshacer
                  </p>
                  <Button variant="destructive" size="sm">
                    Eliminar Cuenta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
