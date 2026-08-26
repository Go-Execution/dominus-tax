import { useEffect, useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import Logo from './Logo';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (href: string) => {
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-dominus-black/90 backdrop-blur-xl border-b border-dominus-gold/20 py-2.5 sm:py-3'
            : 'bg-transparent py-3 sm:py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button onClick={() => handleNav('#home')} className="transition-transform hover:scale-105 flex items-center">
            <Logo size="xl" />
          </button>

          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="font-montserrat text-sm font-medium tracking-wide text-dominus-text-primary/80 hover:text-dominus-gold transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-gold group-hover:w-full transition-all duration-400" />
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:4322563225"
              className="flex items-center gap-2 text-dominus-gold-light/80 hover:text-dominus-gold transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="font-montserrat text-sm font-medium">432-256-3225</span>
            </a>
            <button
              onClick={() => handleNav('#contact')}
              className="btn-gold px-6 py-2.5 rounded-lg text-sm"
            >
              Book Appointment
            </button>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-dominus-gold p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          open ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="absolute inset-0 bg-dominus-black/95 backdrop-blur-xl" onClick={() => setOpen(false)} />
        <nav className="relative flex flex-col items-center justify-center h-full gap-8">
          {NAV_LINKS.map((link, i) => (
            <button
              key={link.href}
              onClick={() => handleNav(link.href)}
              className="font-serif text-3xl text-dominus-text-primary hover:text-dominus-gold transition-colors"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              {link.label}
            </button>
          ))}
          <div className="flex flex-col gap-5 mt-6">
            <a href="tel:4322563225" className="flex items-center justify-center gap-2 text-dominus-gold-light">
              <Phone className="w-5 h-5" />
              <span className="font-montserrat">432-256-3225</span>
            </a>
            <button
              onClick={() => handleNav('#contact')}
              className="btn-gold px-8 py-3 rounded-lg text-sm"
            >
              Book Appointment
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}