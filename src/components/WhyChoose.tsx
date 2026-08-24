import { Award, TrendingUp, Lock, Heart } from 'lucide-react';
import { WHY_CHOOSE } from '@/data/content';

const ICONS: Record<string, React.ElementType> = {
  Award,
  TrendingUp,
  Lock,
  Heart,
};

export default function WhyChoose() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 emerald-radial opacity-20" />
      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <span className="ornament font-montserrat text-xs tracking-[0.3em] uppercase text-dominus-gold/70">
            Our Commitment
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-5 mb-4">
            <span className="text-dominus-text-primary">Why Choose </span>
            <span className="gold-text">Dominus</span>
          </h2>
          <p className="text-dominus-text-primary/60 max-w-2xl mx-auto text-lg">
            We don&apos;t just prepare taxes — we partner with you to build lasting financial
            strength and peace of mind.
          </p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CHOOSE.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Award;
            return (
              <div
                key={item.title}
                className="luxury-card rounded-2xl p-7 reveal text-center group"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-dominus-emerald/20 to-dominus-emerald-deep/10 border border-dominus-gold/30 flex items-center justify-center mb-5 group-hover:shadow-gold-glow transition-all duration-500">
                  <Icon className="w-8 h-8 text-dominus-gold" />
                </div>
                <h3 className="font-serif text-lg font-semibold mb-3 text-dominus-text-primary">
                  {item.title}
                </h3>
                <p className="text-dominus-text-primary/55 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
