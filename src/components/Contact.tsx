import { useEffect, useRef, useState } from 'react';
import {
  Phone,
  Mail,
  Clock,
  MapPin,
} from 'lucide-react';

const TABS = [
  { id: 'appointment', label: 'Intake Form', formSrc: 'https://form.jotform.com/jsform/262376514662461' },
  { id: 'onboarding', label: 'Onboarding', formSrc: 'https://form.jotform.com/jsform/262339213591053' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function JotFormEmbed({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Clear previous form content & load fresh
    ref.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    ref.current.appendChild(script);
  }, [src]);

  return <div ref={ref} className="jotform-embed min-h-[600px]" />;
}

export default function Contact() {
  const [activeTab, setActiveTab] = useState<TabId>('appointment');
  const activeForm = TABS.find((t) => t.id === activeTab)!;

  return (
    <section id="contact" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dominus-black via-dominus-charcoal/40 to-dominus-black" />
      <div className="absolute inset-0 gold-radial opacity-25" />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <span className="ornament font-montserrat text-xs tracking-[0.3em] uppercase text-dominus-gold/70">
            Get In Touch
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-5 mb-4">
            <span className="text-dominus-text-primary">Intake </span>
            <span className="gold-text">Form</span>
          </h2>
          <p className="text-dominus-text-primary/60 max-w-2xl mx-auto text-lg">
            Prepare today. Prosper tomorrow. Schedule your consultation with Dominus Tax
            Consultants and take the first step toward financial empowerment.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left: Contact info */}
          <div className="lg:col-span-2 space-y-6 reveal">
            {/* Contact cards */}
            <a
              href="tel:4322058409"
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
                  432-205-8409
                </p>
              </div>
            </a>

            <a
              href="mailto:dominustaxconsultantsllc@gmail.com"
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
                  dominustaxconsultantsllc@gmail.com
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

          {/* Right: Tabbed JotForm embeds */}
          <div className="lg:col-span-3 reveal">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-gold opacity-20 rounded-3xl blur-sm" />
              <div className="relative bg-gradient-to-br from-dominus-charcoal-light to-dominus-charcoal rounded-3xl border border-dominus-gold/30 shadow-card overflow-hidden">
                {/* Tab switcher */}
                <div className="flex border-b border-dominus-gold/20">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-4 px-6 font-montserrat text-sm font-semibold tracking-wide uppercase transition-all duration-300 relative ${
                        activeTab === tab.id
                          ? 'text-dominus-gold'
                          : 'text-dominus-text-primary/50 hover:text-dominus-text-primary/80'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Form container */}
                <div className="p-4 lg:p-6">
                  <JotFormEmbed src={activeForm.formSrc} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
