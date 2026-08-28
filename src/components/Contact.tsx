import {
  Phone,
  Mail,
  Clock,
  MapPin,
} from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="relative pt-32 pb-24 lg:pt-40 lg:pb-32">
      <div className="absolute inset-0 bg-gradient-to-b from-dominus-black via-dominus-charcoal/40 to-dominus-black" />
      <div className="absolute inset-0 gold-radial opacity-25" />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <span className="ornament font-montserrat text-xs tracking-[0.3em] uppercase text-dominus-gold/70">
            Get In Touch
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-5 mb-4">
            <span className="text-dominus-text-primary">Contact </span>
            <span className="gold-text">Us</span>
          </h2>
          <p className="text-dominus-text-primary/60 max-w-2xl mx-auto text-lg">
            Prepare today. Prosper tomorrow. Reach out to Dominus Tax
            Consultants and take the first step toward financial empowerment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto reveal">
          {/* Contact cards */}
          <a
            href="tel:4322563225"
            className="luxury-card rounded-2xl p-6 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-dominus-emerald/15 border border-dominus-emerald/30 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-dominus-gold" />
            </div>
            <div>
              <p className="font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-1">
                Call Us
              </p>
              <p className="font-serif text-lg text-dominus-text-primary group-hover:text-dominus-gold-light transition-colors">
                432-256-3225
              </p>
            </div>
          </a>

          <a
            href="mailto:info@dominustaxconsultants.com"
            className="luxury-card rounded-2xl p-6 flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-dominus-emerald/15 border border-dominus-emerald/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-dominus-gold" />
            </div>
            <div className="min-w-0">
              <p className="font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-1">
                Email Us
              </p>
              <p className="font-serif text-base text-dominus-text-primary group-hover:text-dominus-gold-light transition-colors truncate">
                info@dominustaxconsultants.com
              </p>
            </div>
          </a>

          <div className="luxury-card rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-dominus-emerald/15 border border-dominus-emerald/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-dominus-gold" />
            </div>
            <div>
              <p className="font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-2">
                Office Hours
              </p>
              <p className="text-dominus-text-primary/90 text-sm leading-relaxed">
                Mon – Fri: 9:00 AM – 7:00 PM
                <br />
                Sat – Sun: 10:00 AM – 6:00 PM
              </p>
            </div>
          </div>

          <div className="luxury-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-dominus-emerald/15 border border-dominus-emerald/30 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-dominus-gold" />
            </div>
            <div>
              <p className="font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-1">
                Service Area
              </p>
              <p className="font-serif text-lg text-dominus-text-primary">
                Serving Clients Nationwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
