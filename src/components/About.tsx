import { Brain, Scale, Gem, Crown } from 'lucide-react';
import { BRAND_VALUES } from '@/data/content';

const ICONS: Record<string, React.ElementType> = {
  Brain,
  Scale,
  Gem,
  Crown,
};

const ABOUT_IMAGE = '/owner.jpeg';

export default function About() {
  return (
    <section id="about" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 gold-radial opacity-30" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Photo */}
          <div className="reveal relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative frame */}
              <div className="absolute -inset-2 border border-dominus-gold/30 rounded-3xl" />
              <div className="absolute -inset-4 border border-dominus-gold/10 rounded-3xl" />

              <div className="relative rounded-2xl overflow-hidden border border-dominus-gold/40 shadow-card">
                <img
                  src={ABOUT_IMAGE}
                  alt="Amanda D. Atchison, Owner of Dominus Tax Consultants"
                  className="w-full h-[500px] lg:h-[580px] object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dominus-black/60 via-transparent to-transparent" />
              </div>

              {/* Signature script */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-dominus-charcoal px-6 py-3 rounded-xl border border-dominus-gold/30 shadow-gold-glow">
                <p className="font-script text-2xl text-dominus-gold-light whitespace-nowrap">
                  Amanda D. Atchison
                </p>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="reveal">
            <span className="ornament font-montserrat text-xs tracking-[0.3em] uppercase text-dominus-gold/70">
              Meet The Owner
            </span>
            <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-5 mb-6">
              <span className="text-dominus-text-primary">Empowering Your </span>
              <span className="gold-text">Financial Future</span>
            </h2>

            <div className="space-y-4 text-dominus-text-primary/70 text-lg leading-relaxed mb-8">
              <p>
                Amanda D. Atchison founded Dominus Tax Consultants with a singular vision: to give
                individuals and business owners the power, strategy, and confidence to take control
                of their financial lives.
              </p>
              <p>
                With years of expertise in tax preparation, resolution, and financial strategy,
                Amanda has built a firm grounded in <span className="text-dominus-gold-light">integrity</span>, driven by{' '}
                <span className="text-dominus-gold-light">strategy</span>, and measured by the{' '}
                <span className="text-dominus-gold-light">success</span> of every client served.
              </p>
              <p>
                From maximizing refunds to resolving complex tax issues, Amanda and the Dominus team
                deliver results with a personal touch — because behind every return is a person, a
                family, and a future worth protecting.
              </p>
            </div>

            {/* Brand values */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {BRAND_VALUES.map((value) => {
                const Icon = ICONS[value.icon] ?? Brain;
                return (
                  <div
                    key={value.name}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dominus-charcoal border border-dominus-gold/15 hover:border-dominus-gold/40 transition-all"
                  >
                    <Icon className="w-6 h-6 text-dominus-gold" />
                    <span className="font-montserrat text-sm font-semibold text-dominus-text-primary/90 tracking-wide">
                      {value.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
