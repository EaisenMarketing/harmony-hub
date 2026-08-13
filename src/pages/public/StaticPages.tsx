import { ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';
import { Seo } from '@/lib/seo';

function Doc({ title, description, path, children }: { title: string; description: string; path: string; children: ReactNode }) {
  return (
    <PublicLayout>
      <Seo title={title} description={description} path={path} />
      <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-invert">
        <h1>{title}</h1>
        {children}
      </div>
    </PublicLayout>
  );
}

export function AboutPage() {
  return (
    <Doc title="Nosotros" description="Acorde Live es una escuela de música 100% online con maestros reales." path="/nosotros">
      <p>
        Acorde Live es una escuela de música 100% online. Nuestro objetivo es que
        cualquier persona, en cualquier parte del mundo, pueda aprender un
        instrumento con maestros reales, a un precio justo y con acompañamiento humano.
      </p>
      <p>
        Ofrecemos formación en guitarra acústica y eléctrica, bajo, batería,
        piano y trompeta, combinando clases en vivo por Zoom
        con contenido on-demand.
      </p>
      <p>
        ¿Quieres saber más o dar clases con nosotros?{' '}
        <Link to="/contacto">Escríbenos</Link> o{' '}
        <Link to="/ser-maestro">postúlate como maestro</Link>.
      </p>
    </Doc>
  );
}

export function FaqPage() {
  const faqs: [string, string][] = [
    ['¿Cómo funcionan las clases?', 'Combinamos clases en vivo por Zoom (semanales según el plan) con lecciones on-demand que puedes ver a tu ritmo.'],
    ['¿Necesito tener un instrumento?', 'Sí. Necesitas tu instrumento y auriculares/altavoces, además de una conexión estable para las clases en vivo por Zoom.'],
    ['¿Los pagos son seguros?', 'Sí, los pagos se procesan por un proveedor de pagos certificado. No almacenamos datos de tarjeta en nuestros servidores.'],
    ['¿Puedo cancelar cuando quiera?', 'Sí. Cancelas desde tu portal y conservas acceso hasta el final del periodo pagado. Ver Política de Cancelación.'],
    ['¿Los certificados son oficiales?', 'Emitimos un Certificado digital de finalización de Acorde Live. No es un título con validez oficial estatal.'],
    ['¿Puedo cambiar de instrumento en el plan Estándar?', 'El plan Estándar da acceso a un instrumento principal. Puedes solicitar el cambio desde tu panel; puede haber una restricción de una vez por periodo.'],
  ];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
  return (
    <PublicLayout>
      <Seo
        title="Preguntas frecuentes"
        description="Respuestas a las preguntas más comunes sobre Acorde Live: clases, pagos, cancelación y certificados."
        path="/preguntas-frecuentes"
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-4xl font-black text-white mb-8">Preguntas frecuentes</h1>
        <div className="space-y-4">
          {faqs.map(([q, a]) => (
            <details key={q} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <summary className="cursor-pointer font-semibold text-white">{q}</summary>
              <p className="mt-3 text-white/70 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

export function TermsPage() {
  return (
    <Doc title="Términos y Condiciones" description="Términos y condiciones de uso de Acorde Live." path="/terminos">
      <p><strong>Vigente desde:</strong> {new Date().getFullYear()}. Estos términos regulan el uso de la plataforma Acorde Live.</p>
      <h2>1. Cuenta</h2>
      <p>Debes ser mayor de edad o contar con autorización de tu tutor. Eres responsable de la seguridad de tu contraseña.</p>
      <h2>2. Suscripciones</h2>
      <p>Las suscripciones son mensuales y se renuevan automáticamente hasta que las canceles desde tu portal.</p>
      <h2>3. Contenido</h2>
      <p>El contenido (videos, materiales, grabaciones de clases) es propiedad de Acorde Live y de sus maestros. Está prohibida su redistribución.</p>
      <h2>4. Conducta</h2>
      <p>En clases en vivo y comunidad se exige respeto. Faltas graves pueden derivar en suspensión sin reembolso.</p>
      <h2>5. Limitación de responsabilidad</h2>
      <p>La plataforma se ofrece "tal cual". Hacemos nuestro mejor esfuerzo por mantener la disponibilidad y la calidad.</p>
      <h2>6. Contacto</h2>
      <p>Para dudas legales: <a href="mailto:hola@acordelive.com">hola@acordelive.com</a>.</p>
    </Doc>
  );
}

export function PrivacyPage() {
  return (
    <Doc title="Política de Privacidad" description="Cómo tratamos tus datos en Acorde Live." path="/privacidad">
      <p>Respetamos tu privacidad. Este documento describe qué datos recolectamos y cómo los usamos.</p>
      <h2>Datos que recolectamos</h2>
      <ul>
        <li>Datos de cuenta: nombre, email, contraseña cifrada.</li>
        <li>Progreso del curso, lecciones vistas, tareas enviadas.</li>
        <li>Datos de facturación gestionados por nuestro proveedor de pagos (no almacenamos tarjetas).</li>
      </ul>
      <h2>Uso</h2>
      <p>Utilizamos tus datos para prestar el servicio, mejorar el producto y contactarte con información relevante de tu cuenta.</p>
      <h2>Derechos</h2>
      <p>Puedes solicitar acceso, corrección o eliminación de tus datos escribiendo a <a href="mailto:hola@acordelive.com">hola@acordelive.com</a>.</p>
    </Doc>
  );
}

export function CancelPolicyPage() {
  return (
    <Doc title="Política de Cancelación" description="Cómo cancelar tu suscripción de Acorde Live." path="/politica-de-cancelacion">
      <p>Puedes cancelar tu suscripción en cualquier momento desde tu portal.</p>
      <ul>
        <li>Conservas acceso al contenido premium hasta el final del periodo ya pagado.</li>
        <li>No hay reembolsos automáticos por periodos ya iniciados.</li>
        <li>Tu progreso y certificados obtenidos se conservan aunque canceles.</li>
        <li>Casos especiales: escríbenos a <a href="mailto:hola@acordelive.com">hola@acordelive.com</a>.</li>
      </ul>
    </Doc>
  );
}

// Rerutas
export function LoginAlias() { return <Navigate to="/auth" replace />; }
export function RegisterAlias() { return <Navigate to="/auth?mode=register" replace />; }
export function RecoverAlias() { return <Navigate to="/auth?mode=recover" replace />; }
export function TeacherAlias() { return <Navigate to="/aplicar-maestro" replace />; }
