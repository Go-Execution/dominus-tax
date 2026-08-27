import { useState, useEffect, useRef } from 'react';
import { X, FileText } from 'lucide-react';

const TABS = [
  { id: 'appointment', label: 'Intake Form', formSrc: 'https://form.jotform.com/jsform/262376514662461' },
  { id: 'onboarding', label: 'Onboarding', formSrc: 'https://form.jotform.com/jsform/262339213591053' },
] as const;

type TabId = (typeof TABS)[number]['id'];

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
  const [activeTab, setActiveTab] = useState<TabId>('appointment');
  const activeForm = TABS.find((t) => t.id === activeTab)!;

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

  // Listen for custom event to open form from other components
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-contact-form', handleOpen);
    return () => window.removeEventListener('open-contact-form', handleOpen);
  }, []);

  return (
    <>
      {/* Floating Tab Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-dominus-gold text-dominus-black px-3 py-5 rounded-l-xl shadow-gold-glow z-40 flex flex-col items-center gap-3 hover:bg-dominus-gold-light transition-colors group border-y border-l border-dominus-gold/50"
      >
        <FileText className="w-5 h-5 flex-shrink-0" />
        <span 
          className="font-montserrat font-bold tracking-widest uppercase flex items-center whitespace-nowrap"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
        >
          Contact Us
        </span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-dominus-black/90 backdrop-blur-sm">
          {/* Modal Content */}
          <div className="relative w-full max-w-5xl h-full max-h-[90vh] bg-gradient-to-br from-dominus-charcoal-light to-dominus-charcoal rounded-3xl border border-dominus-gold/30 shadow-card flex flex-col overflow-hidden animate-fade-in">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-dominus-black/50 rounded-full flex items-center justify-center text-dominus-gold hover:text-dominus-gold-light hover:bg-dominus-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Tab switcher */}
            <div className="flex border-b border-dominus-gold/20 flex-shrink-0 bg-dominus-charcoal pt-2 px-2 lg:px-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-5 px-6 font-montserrat text-sm font-semibold tracking-wide uppercase transition-all duration-300 relative ${
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

            {/* Form container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
              <JotFormEmbed src={activeForm.formSrc} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
