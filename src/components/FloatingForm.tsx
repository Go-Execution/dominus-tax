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
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
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
    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('aria-hidden'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleDialogKeys);
    return () => window.removeEventListener('keydown', handleDialogKeys);
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
        className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-dominus-gold/50 bg-dominus-gold px-4 py-3 text-dominus-black shadow-gold-glow transition-colors hover:bg-dominus-gold-light sm:bottom-auto sm:right-0 sm:top-1/2 sm:-translate-y-1/2 sm:flex-col sm:gap-3 sm:rounded-l-xl sm:rounded-r-none sm:border-r-0 sm:px-3 sm:py-5"
        aria-label="Start — open Dominus intake forms"
      >
        <FileText className="w-5 h-5 flex-shrink-0" />
        <span className="font-montserrat text-xs font-bold uppercase tracking-widest sm:hidden">Start</span>
        <span
          className="hidden font-montserrat font-bold tracking-widest uppercase whitespace-nowrap sm:flex"
          aria-hidden="true"
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
        aria-hidden={!isOpen}
      >
        {/* Modal Content */}
        <div
          ref={dialogRef}
          className={`relative w-full sm:max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-dominus-charcoal-light sm:bg-gradient-to-br from-dominus-charcoal-light to-dominus-charcoal sm:rounded-3xl sm:border border-dominus-gold/30 shadow-card flex flex-col overflow-hidden transition-transform duration-300 delay-75 ${
            isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-form-title"
        >
            <h2 id="lead-form-title" className="sr-only">{activeForm.label}</h2>

            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-dominus-gold/20 flex-shrink-0 bg-dominus-charcoal px-2 lg:px-6">
              <div className="flex flex-1" role="tablist" aria-label="Choose an intake form">
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
                    aria-controls="lead-form-panel"
                    tabIndex={activeJourney === journey ? 0 : -1}
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
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-2 w-10 h-10 rounded-full flex items-center justify-center text-dominus-gold hover:text-dominus-gold-light hover:bg-dominus-black/50 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form container - Scrollable */}
            <div id="lead-form-panel" role="tabpanel" className="flex-1 overflow-y-auto bg-white p-0 sm:p-4 lg:p-8">
              {isOpen && <JotFormEmbed key={activeJourney} src={activeForm.formSrc} />}
            </div>
          </div>
        </div>
    </>
  );
}
