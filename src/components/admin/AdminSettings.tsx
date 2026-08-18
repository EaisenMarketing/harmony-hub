import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mail, Globe, CreditCard, GraduationCap, Clock } from 'lucide-react';

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs text-foreground font-medium text-right break-all">{value}</span>
  </div>
);

const Soon = () => (
  <Badge variant="outline" className="text-[10px]">
    <Clock className="w-3 h-3 mr-1" />
    Próximamente
  </Badge>
);

/**
 * Configuración de la escuela Acorde Live (mi negocio propio).
 * Nada de lo que se ve aquí pertenece al módulo B2B de maestros: la
 * configuración de cada estudio (su Stripe y sus correos) vive en /estudio.
 */
export const AdminSettings = () => (
  <div className="space-y-6">
    <Card className="p-4 bg-card/70 border-white/10 space-y-3">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Correos de la escuela</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Estos son los correos de Acorde Live: registros, prueba gratis, suscripciones, clases de la academia y avisos.
        Se envían con la marca Acorde Live y son un canal totalmente separado del de los maestros B2B.
      </p>
      <div>
        <Row label="Remitente principal" value="Acorde Live <hola@acordelive.com>" />
        <Row label="Remitente de estudios (B2B)" value="estudios@acordelive.com" />
        <Row label="Proveedor de envío" value="Resend" />
      </div>
    </Card>

    <Card className="p-4 bg-card/70 border-white/10 space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Cobros</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Tu cuenta principal de Stripe cobra únicamente dos cosas: las membresías de los alumnos de tu escuela y la
        suscripción mensual de los maestros B2B al software.
      </p>
      <div>
        <Row label="Cobros a alumnos de Acorde Live" value="Cuenta principal de Stripe" />
        <Row label="Suscripción SaaS de maestros" value="Cuenta principal de Stripe" />
        <Row label="Cobros de un maestro a SUS alumnos" value="Cuenta de Stripe conectada del maestro" />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/maestros-b2b">
            <GraduationCap className="w-3.5 h-3.5 mr-2" />
            Ver maestros B2B
          </Link>
        </Button>
        <span className="text-xs text-muted-foreground">Cambiar precios de planes desde aquí</span>
        <Soon />
      </div>
    </Card>

    <Card className="p-4 bg-card/70 border-white/10 space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Sitio y dominio</h3>
      </div>
      <div>
        <Row label="Dominio público" value="acordelive.com" />
        <Row label="Enlaces de maestros" value="acordelive.com/nombre-del-estudio" />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs text-muted-foreground">Editar textos de la página pública</span>
        <Soon />
        <span className="text-xs text-muted-foreground">Dominios de correo por maestro (DKIM)</span>
        <Soon />
      </div>
    </Card>
  </div>
);
