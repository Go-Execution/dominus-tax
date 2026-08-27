import {
  User,
  Building2,
  Target,
  ShieldCheck,
  FileSignature,
  CreditCard,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { SERVICES } from '@/data/content';

const ICONS: Record<string, React.ElementType> = {
  User,
  Building2,
  Target,
  ShieldCheck,
  FileSignature,
  CreditCard,
  GraduationCap,
};

export default function Services() {
  const scrollTo = (href: string) => {
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', href);
    } else {
      window.location.hash = href;
    }
  };

  return (
    <section id="services" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 emerald-radial opacity-20" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <span className="ornament font-montserrat text-xs tracking-[0.3em] uppercase text-dominus-gold/70">
            What We Offer
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-5 mb-4">
            <span className="text-dominus-text-primary">Signature </span>
            <span className="gold-text">Services</span>
          </h2>
          <p className="text-dominus-text-primary/60 max-w-2xl mx-auto text-lg">
            Comprehensive tax and financial services delivered with expertise, precision, and a
            relentless commitment to your success.
          </p>
        </div>

        {/* Service grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service, i) => {
            const Icon = ICONS[service.icon] ?? User;
            return (
              <div
                key={service.title}
                className="luxury-card rounded-2xl p-8 reveal group cursor-pointer"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-dominus-emerald/15 border border-dominus-emerald/30 flex items-center justify-center mb-6 group-hover:bg-dominus-emerald/25 transition-colors">
                  <Icon className="w-7 h-7 text-dominus-gold" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3 text-dominus-text-primary group-hover:text-dominus-gold-light transition-colors">
                  {service.title}
                </h3>
                <p className="text-dominus-text-primary/60 text-sm leading-relaxed mb-5">
                  {service.description}
                </p>
                <button
                  onClick={() => scrollTo('#contact')}
                  className="flex items-center gap-2 text-dominus-gold/80 hover:text-dominus-gold text-sm font-montserrat font-medium transition-all group-hover:gap-3"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
