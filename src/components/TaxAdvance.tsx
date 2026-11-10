import { Zap, Clock, ShieldCheck, CheckCircle, ArrowRight } from 'lucide-react';

export default function TaxAdvance() {
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
    <section id="tax-advance" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Premium dark emerald background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dominus-charcoal via-dominus-black to-dominus-emerald-deep/30" />
      <div className="absolute inset-0 gold-radial opacity-40" />
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="relative max-w-6xl mx-auto px-5 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden reveal">
          {/* Outer gold border */}
          <div className="absolute -inset-0.5 bg-gradient-gold opacity-50 rounded-3xl blur-sm" />

          <div className="relative bg-gradient-to-br from-dominus-charcoal-light to-dominus-charcoal rounded-3xl border-2 border-dominus-gold/50 px-6 py-12 lg:px-16 lg:py-16 overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-dominus-gold/10 rounded-full blur-3xl animate-glow-pulse" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-dominus-emerald/10 rounded-full blur-3xl" />

            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              {/* Left: Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-dominus-gold/10 border border-dominus-gold/30 rounded-full px-4 py-2 mb-6">
                  <Zap className="w-4 h-4 text-dominus-gold-bright" />
                  <span className="font-montserrat text-xs font-bold tracking-wide text-dominus-gold-light uppercase">
                    Featured Offer
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                  <span className="text-dominus-text-primary">Need Money Fast?</span>
                </h2>
                <p className="text-dominus-text-primary/70 text-lg mb-2">
                  Get a Tax Advance of up to
                </p>
                <div className="mb-6">
                  <span className="font-serif text-6xl lg:text-7xl font-bold gold-shimmer-text">
                    $7,500
                  </span>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {['No Credit Check', 'Fast Approval', 'Funds in 24 Hours'].map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-2 bg-dominus-black/40 border border-dominus-gold/25 rounded-full px-4 py-2"
                    >
                      <CheckCircle className="w-4 h-4 text-dominus-emerald-bright" />
                      <span className="font-montserrat text-xs sm:text-sm font-medium text-dominus-text-primary/90">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <button
                    onClick={() => scrollTo('#contact')}
                    className="btn-gold px-8 py-4 rounded-xl text-sm sm:text-base flex items-center gap-2 group"
                  >
                    Apply Now
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <p className="text-xs text-dominus-text-secondary italic">
                  *Restrictions Apply
                </p>
              </div>

              {/* Right: Visual highlights */}
              <div className="flex flex-col gap-4">
                {[
                  { icon: Clock, title: '24-Hour Funding', text: 'Get approved funds deposited as fast as the next business day.' },
                  { icon: ShieldCheck, title: 'No Credit Check Required', text: 'Your tax refund secures your advance — your credit history stays untouched.' },
                  { icon: Zap, title: 'Simple, Streamlined Process', text: 'Quick application, minimal paperwork, and a dedicated specialist to guide you.' },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    className="flex gap-4 p-5 rounded-xl bg-dominus-black/40 border border-dominus-gold/15 hover:border-dominus-gold/40 transition-all"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-dominus-gold/10 border border-dominus-gold/25 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-dominus-gold" />
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-dominus-text-primary text-sm mb-1">
                        {item.title}
                      </h3>
                      <p className="text-dominus-text-primary/55 text-sm leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
