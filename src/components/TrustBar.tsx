import { Sparkles, ShieldCheck, TrendingUp, Award } from 'lucide-react';

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: 'Audit-Ready Protection' },
  { icon: TrendingUp, text: 'Strategic Wealth Growth' },
  { icon: Award, text: 'Nationwide Authority' },
];

export default function TrustBar() {
  return (
    <section className="relative py-12 lg:py-16 border-y border-dominus-gold/25 bg-gradient-to-b from-dominus-charcoal/90 via-dominus-charcoal-light to-dominus-charcoal/90 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute inset-0 gold-radial opacity-35 pointer-events-none" />
      <div className="absolute inset-0 emerald-radial opacity-20 pointer-events-none" />
      
      {/* Top subtle highlight line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-dominus-gold-light/60 to-transparent" />
      {/* Bottom subtle highlight line */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-dominus-gold/40 to-transparent" />

      <div className="relative max-w-6xl mx-auto px-5 lg:px-8 text-center">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-dominus-text-primary leading-tight sm:leading-snug mb-8">
          <span>Where Tax Strategy </span>
          <span className="gold-shimmer-text italic font-serif drop-shadow-[0_2px_15px_rgba(201,162,39,0.3)]">
            Builds Legacy.
          </span>
        </h2>
      </div>
    </section>
  );
}
