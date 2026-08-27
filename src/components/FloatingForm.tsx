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
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 lg:p-8 bg-dominus-black/95 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Modal Content */}
        <div 
          className={`relative w-full sm:max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[90vh] bg-dominus-charcoal-light sm:bg-gradient-to-br from-dominus-charcoal-light to-dominus-charcoal sm:rounded-3xl sm:border border-dominus-gold/30 shadow-card flex flex-col overflow-hidden transition-transform duration-300 delay-75 ${
            isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
          }`}
        >

            {/* Header & Tabs */}
            <div className="flex items-center justify-between border-b border-dominus-gold/20 flex-shrink-0 bg-dominus-charcoal px-2 lg:px-6">
              <div className="flex flex-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 sm:py-5 px-3 sm:px-6 font-montserrat text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all duration-300 relative ${
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
              
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="ml-2 w-10 h-10 rounded-full flex items-center justify-center text-dominus-gold hover:text-dominus-gold-light hover:bg-dominus-black/50 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-0 sm:p-4 lg:p-8 bg-white/5 sm:bg-transparent">
              <JotFormEmbed src={activeForm.formSrc} />
            </div>
          </div>
        </div>
    </>
  );
}
