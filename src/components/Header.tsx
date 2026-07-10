import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.webp';

const navItems = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Cursos', href: '#instrumentos' },
  { label: 'Clases en Vivo', href: '#calendario' },
  { label: 'Precios', href: '#precios' },
  { label: 'Testimonios', href: '#testimonios' },
  { label: 'FAQ', href: '#faq' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-premium-dark/95 backdrop-blur-xl shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img decoding="async" src={logo} alt="Acorde Live" className="w-10 h-10 rounded-xl object-cover" width="40" height="40" />
            <span className="text-xl font-bold text-white hidden sm:block">
              Acorde Live
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/auth" className="inline-flex h-9 items-center justify-center rounded-md border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/20">
              Acceso
            </Link>
            <Link to="/aplicar-maestro">
              <span className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                Ser Maestro
              </span>
            </Link>
            <a href="#precios">
              <span className="inline-flex h-9 items-center justify-center rounded-md bg-gradient-to-r from-indigo-600 to-emerald-500 px-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105">
                Obtén Suscripción Pro
              </span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span className="block h-6 w-6 text-2xl leading-6">{isMobileMenuOpen ? '×' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-premium-dark/98 backdrop-blur-xl border-t border-white/10">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-medium text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white">
                  Acceso
                </Link>
                <Link to="/aplicar-maestro" onClick={() => setIsMobileMenuOpen(false)} className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-white/80">
                  Ser Maestro
                </Link>
                <a href="#precios" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-500 px-4 text-sm font-semibold text-white">
                    Obtén Suscripción Pro
                  </span>
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
