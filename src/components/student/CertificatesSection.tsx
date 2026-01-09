import { Award, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Certificate {
  id: string;
  courseTitle: string;
  instrument: string;
  earnedAt: string;
  level: string;
}

// Placeholder certificates - will be populated from database when certificates table is created
const mockCertificates: Certificate[] = [];

export const CertificatesSection = () => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-semibold text-foreground">Mis Certificados</h2>
      </div>

      {mockCertificates.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-12 text-center">
            <Award className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              ¡Aún no tienes certificados!
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Completa un curso al 100% para obtener tu certificado de finalización.
              Los certificados son una excelente manera de demostrar tus habilidades.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockCertificates.map((cert) => (
            <Card key={cert.id} className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
              <div className="h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 relative">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-20" />
                <Award className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white/80" />
              </div>
              <CardContent className="p-4">
                <Badge variant="outline" className="mb-2">
                  {cert.level}
                </Badge>
                <h3 className="font-semibold text-foreground">{cert.courseTitle}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Obtenido el {new Date(cert.earnedAt).toLocaleDateString('es-ES')}
                </p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Download className="w-4 h-4" />
                    Descargar
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};
