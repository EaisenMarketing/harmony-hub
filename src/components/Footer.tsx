import { Link } from 'react-router-dom';
import { Music2, Mail, Phone, Instagram, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';

const footerLinks = {
  platform: [
    { label: 'Cursos', href: '#instrumentos' },
    { label: 'Clases en Vivo', href: '#calendario' },
    { label: 'Precios', href: '#precios' },
    { label: 'Certificados', href: '#' },
  ],
  support: [
    { label: 'Centro de Ayuda', href: '#' },
    { label: 'Contacto', href: '#' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Comunidad', href: '#' },
  ],
  legal: [
    { label: 'Términos y Condiciones', href: '#' },
    { label: 'Política de Privacidad', href: '#' },
    { label: 'Cookies', href: '#' },
    { label: 'Reembolsos', href: '#' },
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
                Únete a miles de estudiantes que ya están aprendiendo con nosotros.
              </p>
            </div>
            <Link to="/auth">
              <Button variant="gradient" size="xl" className="flex-shrink-0">
                Comenzar Gratis
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Acorde Live</span>
            </a>
            <p className="text-white/60 mb-6 max-w-sm">
              Aprende música desde cualquier lugar con profesores reales. Clases en vivo, cursos grabados y una comunidad que te apoya.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:hola@acordelive.com" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                <span>hola@acordelive.com</span>
              </a>
              <a href="#" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
                <span>WhatsApp: +52 55 1234 5678</span>
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Soporte</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-white/60 hover:text-white transition-colors">
                    {link.label}
                  </a>
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
