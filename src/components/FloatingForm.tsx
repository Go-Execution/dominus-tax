import { useState, useEffect, useRef } from 'react';
import { X, FileText } from 'lucide-react';
import {
  isLeadJourney,
  LEAD_FORM_EVENT,
  LEAD_FORMS,
  type LeadJourney,
} from '@/lib/leadForms';

const JOURNEYS = Object.entries(LEAD_FORMS) as Array<
  [LeadJourney, (typeof LEAD_FORMS)[LeadJourney]]
>;

function JotFormEmbed({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    ref.current.appendChild(script);
  }, [src]);

  return <div ref={ref} className="jotform-embed min-h-[600px] w-full" />;
}

export default function FloatingForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeJourney, setActiveJourney] = useState<LeadJourney>('tax-client');
  const activeForm = LEAD_FORMS[activeJourney];

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Open the correct journey when another part of the site requests a form.
  useEffect(() => {
    const handleOpen = (event: Event) => {
      const journey = (event as CustomEvent<{ journey?: unknown }>).detail?.journey;
      if (isLeadJourney(journey)) setActiveJourney(journey);
      setIsOpen(true);
    };

    const handleLegacyOpen = () => {
      setActiveJourney('tax-client');
      setIsOpen(true);
    };

    window.addEventListener(LEAD_FORM_EVENT, handleOpen);
    window.addEventListener('open-contact-form', handleLegacyOpen);
    return () => {
      window.removeEventListener(LEAD_FORM_EVENT, handleOpen);
      window.removeEventListener('open-contact-form', handleLegacyOpen);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  return (
    <>
      {/* Floating Tab Button */}
      <button
        type="button"
        onClick={() => {
          setActiveJourney('tax-client');
          setIsOpen(true);
        }}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-dominus-gold text-dominus-black px-3 py-5 rounded-l-xl shadow-gold-glow z-40 flex flex-col items-center gap-3 hover:bg-dominus-gold-light transition-colors group border-y border-l border-dominus-gold/50"
        aria-label="Open Dominus intake forms"
      >
        <FileText className="w-5 h-5 flex-shrink-0" />
        <span 
          className="font-montserrat font-bold tracking-widest uppercase flex items-center whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
        >
          Start Here
        </span>
      </button>

      {/* Modal Overlay */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 lg:p-8 bg-dominus-black/95 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}
        role="presentation"
      >
        {/* Modal Content */}
        <div 
          className={`relative w-full sm:max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-dominus-charcoal-light sm:bg-gradient-to-br from-dominus-charcoal-light to-dominus-charcoal sm:rounded-3xl sm:border border-dominus-gold/30 shadow-card flex flex-col overflow-hidden transition-transform duration-300 delay-75 ${
            isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={activeForm.label}
        >

            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-dominus-gold/20 flex-shrink-0 bg-dominus-charcoal px-2 lg:px-6">
              <div className="flex flex-1">
                {JOURNEYS.map(([journey, form]) => (
                  <button
                    key={journey}
                    type="button"
                    onClick={() => setActiveJourney(journey)}
                    className={`py-4 sm:py-5 px-3 sm:px-6 font-montserrat text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all duration-300 relative ${
                      activeJourney === journey
                        ? 'text-dominus-gold'
                        : 'text-dominus-text-primary/50 hover:text-dominus-text-primary/80'
                    }`}
                    aria-selected={activeJourney === journey}
                    role="tab"
                  >
                    <span className="hidden sm:inline">{form.label}</span>
                    <span className="sm:hidden">{form.shortLabel}</span>
                    {activeJourney === journey && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-gold" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-2 w-10 h-10 rounded-full flex items-center justify-center text-dominus-gold hover:text-dominus-gold-light hover:bg-dominus-black/50 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-4 lg:p-8 bg-white/5 sm:bg-transparent">
              {isOpen && <JotFormEmbed key={activeJourney} src={activeForm.formSrc} />}
            </div>
          </div>
        </div>
    </>
  );
}
