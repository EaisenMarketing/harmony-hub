import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, Youtube } from 'lucide-react';
import logo from '@/assets/logo.webp';
import { Button } from '@/components/ui/button';

const footerLinks = {
  platform: [
    { label: 'Cursos', to: '/cursos' },
    { label: 'Clases en Vivo', to: '/clases-en-vivo' },
    { label: 'Precios', to: '/precios' },
    { label: 'Maestros', to: '/maestros' },
  ],
  support: [
    { label: 'Preguntas frecuentes', to: '/preguntas-frecuentes' },
    { label: 'Contacto', to: '/contacto' },
    { label: 'Ser Maestro', to: '/ser-maestro' },
    { label: 'Nosotros', to: '/nosotros' },
  ],
  legal: [
    { label: 'Términos y Condiciones', to: '/terminos' },
    { label: 'Política de Privacidad', to: '/privacidad' },
    { label: 'Política de Cancelación', to: '/politica-de-cancelacion' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-premium-dark text-white pt-20 pb-8">
      <div className="container mx-auto px-4">
        {/* CTA Section */}
        <div className="relative rounded-2xl bg-gradient-to-r from-indigo-600/20 to-emerald-500/20 border border-white/10 p-8 md:p-12 mb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-emerald-500/10" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                ¿Listo para comenzar tu viaje musical?
              </h3>
              <p className="text-white/60">
                Elige tu plan y empieza hoy con maestros reales.
              </p>
            </div>
            <Link to="/precios">
              <Button variant="gradient" size="xl" className="flex-shrink-0">
                Ver planes
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img loading="lazy" decoding="async" src={logo} alt="Acorde Live" className="w-10 h-10 rounded-xl object-cover" />
              <span className="text-xl font-bold">Acorde Live</span>
            </Link>
            <p className="text-white/60 mb-6 max-w-sm">
              Escuela de música 100% online. Guitarra, bajo, batería, piano, trompeta y producción musical
              con maestros reales.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:hola@acordelive.com" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                <span>hola@acordelive.com</span>
              </a>
              <Link to="/contacto" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
                <span>Formulario de contacto</span>
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a href="https://instagram.com/acordelive" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@acordelive" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Soporte</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">
              © 2026 Acorde Live. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <button className="px-3 py-1 rounded-md bg-white/10 text-sm hover:bg-white/20 transition-colors">
                ES
              </button>
              <button className="px-3 py-1 rounded-md text-white/40 text-sm hover:bg-white/10 transition-colors">
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
