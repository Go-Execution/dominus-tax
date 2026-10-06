import { Phone, Mail, Clock, MapPin, Instagram, Facebook, Linkedin, Printer } from 'lucide-react';
import Logo from './Logo';

const QUICK_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

const SERVICE_LINKS = [
  'Individual Tax Preparation',
  'Business Tax Preparation',
  'Tax Planning & Strategy',
  'Credit Repair & Restoration',
  'Notary Services',
];

export default function Footer() {
  const handleNav = (href: string) => {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', href);
    } else {
      window.location.hash = href;
    }
  };

  return (
    <footer className="relative bg-dominus-charcoal border-t border-dominus-gold/20 overflow-hidden">
      <div className="absolute inset-0 gold-radial opacity-15" />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Logo size="xl" className="mb-5" />
            <p className="text-dominus-text-primary/60 text-sm leading-relaxed mb-4">
              The Power Behind Your Financial Success. Premium tax preparation and consulting
              serving clients nationwide.
            </p>
            <p className="font-script text-xl text-dominus-gold-light mb-6">
              Prepare Today. Prosper Tomorrow.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/dominustaxconsultants"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-dominus-black/60 border border-dominus-gold/25 flex items-center justify-center text-dominus-gold hover:text-dominus-gold-light hover:border-dominus-gold/60 hover:bg-dominus-gold/10 hover:shadow-gold-glow hover:scale-105 transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/share/1HozbqjgoQ/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-dominus-black/60 border border-dominus-gold/25 flex items-center justify-center text-dominus-gold hover:text-dominus-gold-light hover:border-dominus-gold/60 hover:bg-dominus-gold/10 hover:shadow-gold-glow hover:scale-105 transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/posts/dominustaxconsultants_dominustaxconsultants-taxpreparation-taxservices-activity-7499141526980132866-4-Cm?utm_source=share&utm_medium=member_desktop&rcm=ACoAAA-1A2MBoSEkpRCAhYIq5dsM-ctjB6dyMa4"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-dominus-black/60 border border-dominus-gold/25 flex items-center justify-center text-dominus-gold hover:text-dominus-gold-light hover:border-dominus-gold/60 hover:bg-dominus-gold/10 hover:shadow-gold-glow hover:scale-105 transition-all duration-300"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-montserrat text-sm font-bold uppercase tracking-wider text-dominus-gold mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => handleNav(link.href)}
                    className="text-dominus-text-primary/60 hover:text-dominus-gold-light text-sm transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-montserrat text-sm font-bold uppercase tracking-wider text-dominus-gold mb-5">
              Services
            </h4>
            <ul className="space-y-3">
              {SERVICE_LINKS.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => handleNav('#services')}
                    className="text-dominus-text-primary/60 hover:text-dominus-gold-light text-sm transition-colors text-left"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-montserrat text-sm font-bold uppercase tracking-wider text-dominus-gold mb-5">
              Contact
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:4322563225"
                  className="flex items-center gap-3 text-dominus-text-primary/60 hover:text-dominus-gold-light text-sm transition-colors"
                >
                  <Phone className="w-4 h-4 text-dominus-gold flex-shrink-0" />
                  432-256-3225
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@dominustaxconsultants.com"
                  className="flex items-start gap-3 text-dominus-text-primary/60 hover:text-dominus-gold-light text-sm transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-dominus-gold flex-shrink-0 mt-0.5" />
                  info@dominustaxconsultants.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-dominus-text-primary/60 text-sm">
                <Printer className="w-4 h-4 text-dominus-gold flex-shrink-0" />
                <span>Fax: 432-257-3754</span>
              </li>
              <li className="flex items-start gap-3 text-dominus-text-primary/60 text-sm">
                <Clock className="w-4 h-4 text-dominus-gold flex-shrink-0 mt-0.5" />
                <span>
                  Mon–Sat: 9 AM – 7 PM
                </span>
              </li>
              <li className="flex items-start gap-3 text-dominus-text-primary/60 text-sm">
                <MapPin className="w-4 h-4 text-dominus-gold flex-shrink-0 mt-0.5" />
                Serving Clients Nationwide
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="section-divider mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-dominus-text-secondary text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} Dominus Tax Consultants, LLC. All rights reserved.
          </p>
          <a
            href="#terms"
            className="text-dominus-text-primary/50 hover:text-dominus-gold text-xs transition-colors font-montserrat tracking-wide"
          >
            Terms &amp; Conditions
          </a>
          <p className="font-montserrat text-xs tracking-[0.2em] uppercase text-dominus-gold/70 text-center">
            Expertise That Empowers &bull; Success That Builds Legacy
          </p>
        </div>
      </div>
    </footer>
  );
}
