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
                <div className="absolute inset-0 bg-gradient-to-t from-dominus-black via-transparent to-transparent" />

                {/* Name plate */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dominus-black/95 to-transparent text-center lg:text-left">
                  <p className="font-script text-2xl text-dominus-gold-light mb-1">Amanda D. Atchison</p>
                  <p className="font-montserrat text-xs tracking-[0.25em] uppercase text-dominus-text-primary/60">
                    Owner &amp; Lead Consultant
                  </p>
                </div>
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

            <div className="space-y-4 text-dominus-text-primary/70 text-lg leading-relaxed">
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
          </div>
        </div>
      </div>
    </section>
  );
}
