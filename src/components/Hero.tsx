import { ArrowRight, Zap } from 'lucide-react';
import Logo from './Logo';

const HERO_IMAGE =
  'https://images.pexels.com/photos/9790816/pexels-photo-9790816.jpeg?auto=compress&cs=tinysrgb&w=900';

export default function Hero() {
  const scrollTo = (href: string) =>
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });

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
            {/* Large logo treatment */}
            <div className="flex justify-center lg:justify-start mb-8 animate-fade-in">
              <Logo size="lg" />
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] mb-6 animate-fade-in-up">
              <span className="text-dominus-text-primary">The Power Behind </span>
              <span className="gold-text">Your Financial Success</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-dominus-text-primary/70 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              Professional tax preparation &amp; strategy that delivers{' '}
              <span className="text-dominus-gold-light font-semibold">more money</span> and{' '}
              <span className="text-dominus-gold-light font-semibold">less stress</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <button
                onClick={() => scrollTo('#contact')}
                className="btn-gold px-8 py-4 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 group"
              >
                Book Your Appointment
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => scrollTo('#tax-advance')}
                className="btn-gold-outline px-8 py-4 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 text-dominus-gold-bright" />
                Get Tax Advance
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
              <div className="relative rounded-3xl overflow-hidden border-2 border-dominus-gold/40 shadow-2xl">
                <img
                  src={HERO_IMAGE}
                  alt="Amanda D. Atchison, Owner of Dominus Tax Consultants"
                  className="w-full h-[480px] lg:h-[560px] object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dominus-black via-transparent to-transparent" />

                {/* Name plate */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dominus-black/95 to-transparent">
                  <p className="font-script text-2xl text-dominus-gold-light mb-1">Amanda D. Atchison</p>
                  <p className="font-montserrat text-xs tracking-[0.25em] uppercase text-dominus-text-primary/60">
                    Owner &amp; Lead Consultant
                  </p>
                </div>
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
