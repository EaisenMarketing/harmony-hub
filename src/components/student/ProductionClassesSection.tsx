import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Headphones, Play, FileText, Lock } from 'lucide-react';
import { useUserPlan } from '@/hooks/useCourseViewer';

export const ProductionClassesSection = () => {
  const { user } = useAuth();
  const { data: userPlan = 'basic' } = useUserPlan();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['production-classes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .eq('instrument', 'drums') // placeholder — production classes would use a dedicated type
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const hasAccess = userPlan === 'production';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Headphones className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Clases de Producción Musical</h2>
            <p className="text-sm text-muted-foreground">Mezcla, mastering, DAWs y grabación</p>
          </div>
        </div>
        {!hasAccess && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="w-3 h-3" />
            Plan Producción requerido
          </Badge>
        )}
      </div>

      {!hasAccess ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acceso exclusivo</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Las clases de producción musical están disponibles si tu instrumento activo es Producción Musical.
            </p>
            <Button variant="gradient">Actualizar Plan</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Headphones className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
            <p className="text-muted-foreground">
              Las clases de producción musical estarán disponibles pronto.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map(cls => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" />
                  {cls.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{cls.description}</p>
                <div className="flex gap-2">
                  {cls.recording_url && (
                    <Button size="sm" variant="outline" className="gap-1">
                      <Play className="w-3 h-3" /> Ver clase
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="gap-1">
                    <FileText className="w-3 h-3" /> Material
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
