import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { openLeadForm } from '@/lib/leadForms';

export default function Hero() {
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
    <section
      id="home"
      className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden"
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-dominus-black" />
      <div className="absolute inset-0 gold-radial opacity-60" />
      <div
        className="absolute inset-0 opacity-[0.04] noise-overlay mix-blend-overlay pointer-events-none"
      />
      {/* Gold light rays */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
        <div className="absolute inset-0 bg-dominus-gold/10 animate-glow-pulse rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left order-2 lg:order-1">


            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] mb-6 animate-fade-in-up">
              <span className="text-dominus-text-primary">Tax Preparation from someone who understands the people who </span>
              <span className="gold-text">Power the Permian</span>
            </h1>

            {/* Subheadline */}
            {/* <p className="text-lg lg:text-xl text-dominus-text-primary/70 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              Professional tax preparation &amp; strategy that delivers{' '}
              <span className="text-dominus-gold-light font-semibold">more money</span> and{' '}
              <span className="text-dominus-gold-light font-semibold">less stress</span>.
            </p> */}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                type="button"
                onClick={() => scrollTo('#booking')}
                className="btn-gold px-8 py-4 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 group"
              >
                Book Your Appointment
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => openLeadForm('consultant')}
                className="btn-gold-outline px-8 py-4 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 group"
              >
                Join Our Consultant Team
                <BriefcaseBusiness className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right: Owner photo */}
          <div className="order-1 lg:order-2 relative animate-scale-in">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Gold frame glow */}
              <div className="absolute -inset-3 bg-gradient-gold opacity-20 blur-2xl rounded-3xl animate-glow-pulse" />
              <div className="absolute -inset-1 bg-gradient-gold opacity-30 rounded-3xl" />

              {/* Photo container */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-dominus-gold/40 shadow-2xl p-4 bg-dominus-charcoal-light/50 flex items-center justify-center">
                <img
                  src="/logo-768.webp"
                  srcSet="/logo-768.webp 768w, /logo.webp 1536w"
                  sizes="(max-width: 1024px) 92vw, 50vw"
                  alt="Dominus Tax Consultants Logo"
                  className="w-full h-auto max-h-[500px] object-contain rounded-2xl"
                  loading="eager"
                  width={1536}
                  height={1024}
                />
              </div>

              {/* Floating badge */}
              <div className="absolute -top-5 -right-3 lg:-right-5 bg-dominus-charcoal border border-dominus-gold/40 rounded-full px-5 py-3 shadow-gold-glow animate-float">
                <span className="font-montserrat text-xs font-bold tracking-wide text-dominus-gold-light">
                  NATIONWIDE SERVICE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dominus-black to-transparent pointer-events-none" />
    </section>
  );
}
