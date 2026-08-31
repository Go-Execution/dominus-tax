import { useEffect } from 'react';
import { Calendar, Clock, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

const CALENDLY_POPUP_URL = 'https://calendly.com/dominustaxconsultantsllc/30min?hide_gdpr_banner=1&background_color=121212&text_color=f5f5f5&primary_color=c9a227';

export default function Booking() {
  useEffect(() => {
    // Inject Calendly external script if not already present
    const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleOpenCalendly = () => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_POPUP_URL });
    } else {
      window.open('https://calendly.com/dominustaxconsultantsllc/30min', '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section id="booking" className="relative py-20 lg:py-28 overflow-hidden bg-dominus-black">
      {/* Ambient background glows */}
      <div className="absolute inset-0 gold-radial opacity-35 pointer-events-none" />
      <div className="absolute inset-0 emerald-radial opacity-20 pointer-events-none" />

      {/* Top and bottom subtle hairpins */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-dominus-gold/30 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-dominus-gold/20 to-transparent" />

      <div className="relative max-w-5xl mx-auto px-5 lg:px-8">
        {/* Luxury CTA Box */}
        <div className="relative luxury-card rounded-3xl p-8 sm:p-12 lg:p-16 border border-dominus-gold/35 shadow-gold-glow text-center overflow-hidden reveal">
          {/* Subtle Corner Brackets */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-dominus-gold/60 rounded-tl-2xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-dominus-gold/60 rounded-tr-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-dominus-gold/60 rounded-bl-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-dominus-gold/60 rounded-br-2xl pointer-events-none" />

          {/* Eyebrow badge */}
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-dominus-gold/10 border border-dominus-gold/30 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-dominus-gold animate-pulse" />
            <span className="font-montserrat text-xs font-bold tracking-[0.25em] uppercase text-dominus-gold-light">
              Direct Online Booking
            </span>
          </div>

          {/* Headline */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-dominus-text-primary mb-5 leading-tight">
            Schedule Your Private <br className="hidden sm:inline" />
            <span className="gold-shimmer-text italic font-serif">Tax Strategy Session</span>
          </h2>

          <p className="text-dominus-text-primary/70 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed mb-10">
            Book a one-on-one 30-minute consultation directly with our lead tax professionals. Pick a time that fits your schedule with instant calendar confirmation.
          </p>

          {/* Key Value Points */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10 text-left">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-dominus-black/40 border border-dominus-gold/15">
              <Clock className="w-5 h-5 text-dominus-gold flex-shrink-0" />
              <div>
                <p className="text-xs font-montserrat uppercase tracking-wider text-dominus-gold/80 font-semibold">Duration</p>
                <p className="text-sm text-dominus-text-primary font-medium">30-Minute Call</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-dominus-black/40 border border-dominus-gold/15">
              <Calendar className="w-5 h-5 text-dominus-gold flex-shrink-0" />
              <div>
                <p className="text-xs font-montserrat uppercase tracking-wider text-dominus-gold/80 font-semibold">Confirmation</p>
                <p className="text-sm text-dominus-text-primary font-medium">Instant &amp; Automated</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-dominus-black/40 border border-dominus-gold/15">
              <ShieldCheck className="w-5 h-5 text-dominus-gold flex-shrink-0" />
              <div>
                <p className="text-xs font-montserrat uppercase tracking-wider text-dominus-gold/80 font-semibold">Privacy</p>
                <p className="text-sm text-dominus-text-primary font-medium">100% Confidential</p>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleOpenCalendly}
              className="btn-gold px-10 py-4 sm:py-5 rounded-xl text-base sm:text-lg font-bold flex items-center justify-center gap-3 group w-full sm:w-auto shadow-gold-glow hover:scale-105 transition-all duration-300"
            >
              <Calendar className="w-5 h-5 text-dominus-black" />
              Book Appointment Now
              <ArrowRight className="w-5 h-5 text-dominus-black transition-transform group-hover:translate-x-1.5" />
            </button>
          </div>

          {/* Guarantee / Micro-copy */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-dominus-text-primary/50 font-montserrat">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-dominus-gold" /> No obligation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-dominus-gold" /> Personalized strategy
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-dominus-gold" /> Nationwide clients served
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
