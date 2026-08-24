import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    text: 'Dominus transformed my tax experience. I received the largest refund I\'ve ever gotten, and the entire process was effortless and professional.',
    name: 'Jessica M.',
    role: 'Individual Client',
  },
  {
    text: 'Amanda and her team handled my business taxes with precision and strategy I hadn\'t experienced before. They saved me thousands. Truly exceptional.',
    name: 'Robert T.',
    role: 'Business Owner',
  },
  {
    text: 'After years of IRS stress, Dominus resolved my tax issues and gave me peace of mind. I finally feel financially empowered. Highly recommend.',
    name: 'Patricia L.',
    role: 'Tax Resolution Client',
  },
];

export default function Testimonials() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 emerald-radial opacity-20" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center mb-16 reveal">
          <span className="ornament font-montserrat text-xs tracking-[0.3em] uppercase text-dominus-gold/70">
            Client Voices
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-5 mb-4">
            <span className="text-dominus-text-primary">Success </span>
            <span className="gold-text">Stories</span>
          </h2>
          <p className="text-dominus-text-primary/60 max-w-2xl mx-auto text-lg">
            Real results from clients who trusted Dominus with their financial future.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className="luxury-card rounded-2xl p-8 reveal"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <Quote className="w-10 h-10 text-dominus-gold/40 mb-5" />
              <p className="text-dominus-text-primary/75 leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-dominus-emerald to-dominus-emerald-deep border border-dominus-gold/30 flex items-center justify-center">
                  <span className="font-serif text-dominus-gold-light font-bold">
                    {t.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-montserrat font-semibold text-dominus-text-primary text-sm">
                    {t.name}
                  </p>
                  <p className="text-dominus-text-secondary text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
