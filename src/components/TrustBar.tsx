const ITEMS = ['Where Tax Strategy Builds Legacy'];

export default function TrustBar() {
  return (
    <section className="relative py-10 border-y border-dominus-gold/15 bg-dominus-charcoal/50">
      <div className="absolute inset-0 gold-radial opacity-30" />
      <div className="relative max-w-5xl mx-auto px-5 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0">
          {ITEMS.map((item, i) => (
            <div key={item} className="flex items-center">
              <span
                className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide text-dominus-text-primary/90"
              >
                {item}
              </span>
              {i < ITEMS.length - 1 && (
                <span className="mx-6 sm:mx-10 text-dominus-gold text-2xl">✦</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
