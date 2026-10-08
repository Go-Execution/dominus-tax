import { ArrowRight, BriefcaseBusiness, Calculator } from 'lucide-react';
import { openLeadForm, type LeadJourney } from '@/lib/leadForms';

const PATHWAYS: Array<{
  journey: LeadJourney;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  icon: React.ElementType;
}> = [
  {
    journey: 'tax-client',
    eyebrow: 'For Individuals & Businesses',
    title: 'I Need Tax Help',
    description:
      'Tell us what you need once. Your information enters the right client intake process for review and follow-up.',
    action: 'Start Client Intake',
    icon: Calculator,
  },
  {
    journey: 'consultant',
    eyebrow: 'For Tax Professionals',
    title: 'I Want to Join Dominus',
    description:
      'Submit your consultant profile, experience, and onboarding details through one dedicated application path.',
    action: 'Start Consultant Application',
    icon: BriefcaseBusiness,
  },
];

export default function LeadPathways() {
  return (
    <section id="start" className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 emerald-radial opacity-30" />
      <div className="relative max-w-6xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 reveal">
          <span className="ornament font-montserrat text-xs tracking-[0.3em] uppercase text-dominus-gold/70">
            Choose Your Path
          </span>
          <h2 className="font-serif text-4xl lg:text-5xl font-bold mt-5 mb-4">
            One Website. <span className="gold-text">Two Clear Journeys.</span>
          </h2>
          <p className="text-dominus-text-primary/60 text-lg">
            Start in the right place so the Dominus team receives the correct information from day
            one.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {PATHWAYS.map(({ journey, eyebrow, title, description, action, icon: Icon }, index) => (
            <article
              key={journey}
              className="luxury-card rounded-3xl p-8 lg:p-10 reveal relative overflow-hidden"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-dominus-gold/5 blur-2xl" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-dominus-emerald/20 border border-dominus-gold/25 flex items-center justify-center mb-7">
                  <Icon className="w-7 h-7 text-dominus-gold" aria-hidden="true" />
                </div>
                <p className="font-montserrat text-[11px] font-bold tracking-[0.18em] uppercase text-dominus-gold/70 mb-3">
                  {eyebrow}
                </p>
                <h3 className="font-serif text-3xl font-semibold text-dominus-text-primary mb-4">
                  {title}
                </h3>
                <p className="text-dominus-text-primary/60 leading-relaxed mb-8">{description}</p>
                <button
                  type="button"
                  onClick={() => openLeadForm(journey)}
                  className={
                    journey === 'tax-client'
                      ? 'btn-gold px-6 py-3.5 rounded-xl flex items-center gap-2 group'
                      : 'btn-gold-outline px-6 py-3.5 rounded-xl flex items-center gap-2 group'
                  }
                >
                  {action}
                  <ArrowRight
                    className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
