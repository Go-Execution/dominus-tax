import { useState } from 'react';
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SERVICE_OPTIONS = [
  'Individual Tax Preparation',
  'Business Tax Preparation',
  'Tax Planning & Strategy',
  'Tax Resolution Services',
  'Notary Services',
  'Credit Repair & Restoration',
  'Tax Advance (up to $7,500)',
  'Onboarding Tax Professionals',
  'Other / General Inquiry',
];

const TIME_OPTIONS = [
  'Morning (9 AM – 12 PM)',
  'Afternoon (12 PM – 3 PM)',
  'Evening (3 PM – 7 PM)',
  'Weekend (10 AM – 6 PM)',
];

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: SERVICE_OPTIONS[0],
    preferred_date: '',
    preferred_time: TIME_OPTIONS[0],
    message: '',
  });

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const { error } = await supabase.from('appointments').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        service: form.service,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time,
        message: form.message || null,
      });

      if (error) throw error;

      setStatus('success');
      setForm({
        name: '',
        email: '',
        phone: '',
        service: SERVICE_OPTIONS[0],
        preferred_date: '',
        preferred_time: TIME_OPTIONS[0],
        message: '',
      });
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again or call us.'
      );
    }
  };

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
            <span className="text-dominus-text-primary">Book Your </span>
            <span className="gold-text">Appointment</span>
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

            {/* QR Code placeholder */}
            <div className="luxury-card rounded-2xl p-6 flex items-center gap-5">
              <div className="w-28 h-28 rounded-xl bg-dominus-black border-2 border-dominus-gold/40 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                {/* Stylized QR placeholder */}
                <svg viewBox="0 0 60 60" className="w-20 h-20">
                  <rect x="0" y="0" width="60" height="60" fill="#0A0A0A" />
                  {[
                    [4, 4, 16, 16], [40, 4, 16, 16], [4, 40, 16, 16],
                    [24, 4, 4, 4], [32, 4, 4, 4], [24, 12, 8, 4],
                    [4, 24, 4, 4], [12, 24, 8, 4], [24, 24, 4, 8],
                    [32, 24, 12, 4], [40, 24, 4, 12], [52, 24, 4, 4],
                    [24, 36, 4, 4], [32, 36, 8, 8], [44, 36, 4, 4],
                    [4, 52, 12, 4], [20, 52, 4, 4], [28, 52, 8, 4],
                    [40, 52, 4, 4], [52, 52, 4, 4],
                  ].map(([x, y, w, h], i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} fill="#C9A227" opacity="0.85" />
                  ))}
                </svg>
              </div>
              <div>
                <p className="font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-1">
                  Scan to Connect
                </p>
                <p className="text-dominus-text-primary/80 text-sm leading-relaxed">
                  Scan the QR code with your phone to save our contact info and book instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Booking form */}
          <div className="lg:col-span-3 reveal">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-gold opacity-20 rounded-3xl blur-sm" />
              <form
                onSubmit={handleSubmit}
                className="relative bg-gradient-to-br from-dominus-charcoal-light to-dominus-charcoal rounded-3xl border border-dominus-gold/30 p-6 lg:p-10 shadow-card"
              >
                <h3 className="font-serif text-2xl font-bold mb-2 text-dominus-text-primary">
                  Request Your Appointment
                </h3>
                <p className="text-dominus-text-primary/50 text-sm mb-8">
                  Fill out the form below and we&apos;ll confirm your appointment within 24 hours.
                </p>

                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-full bg-dominus-emerald/20 border border-dominus-emerald/50 flex items-center justify-center mb-5">
                      <CheckCircle className="w-9 h-9 text-dominus-emerald-bright" />
                    </div>
                    <h4 className="font-serif text-2xl font-bold text-dominus-text-primary mb-3">
                      Appointment Requested!
                    </h4>
                    <p className="text-dominus-text-primary/60 mb-6 max-w-md mx-auto">
                      Thank you for choosing Dominus Tax Consultants. We&apos;ll contact you within
                      24 hours to confirm your appointment. Prepare today. Prosper tomorrow.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStatus('idle')}
                      className="btn-gold-outline px-6 py-3 rounded-lg text-sm"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Field
                        label="Full Name"
                        required
                        value={form.name}
                        onChange={(v) => update('name', v)}
                        placeholder="Jane Doe"
                      />
                      <Field
                        label="Phone Number"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(v) => update('phone', v)}
                        placeholder="432-205-8409"
                      />
                    </div>

                    <Field
                      label="Email Address"
                      type="email"
                      required
                      value={form.email}
                      onChange={(v) => update('email', v)}
                      placeholder="jane@email.com"
                    />

                    <div>
                      <label className="block font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-2">
                        Service Needed
                      </label>
                      <select
                        value={form.service}
                        onChange={(e) => update('service', e.target.value)}
                        className="w-full bg-dominus-black/50 border border-dominus-gold/25 rounded-lg px-4 py-3 text-dominus-text-primary focus:border-dominus-gold focus:outline-none focus:ring-1 focus:ring-dominus-gold/40 transition-colors"
                      >
                        {SERVICE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="bg-dominus-charcoal">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-2">
                          Preferred Date
                        </label>
                        <input
                          type="date"
                          value={form.preferred_date}
                          onChange={(e) => update('preferred_date', e.target.value)}
                          className="w-full bg-dominus-black/50 border border-dominus-gold/25 rounded-lg px-4 py-3 text-dominus-text-primary focus:border-dominus-gold focus:outline-none focus:ring-1 focus:ring-dominus-gold/40 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-2">
                          Preferred Time
                        </label>
                        <select
                          value={form.preferred_time}
                          onChange={(e) => update('preferred_time', e.target.value)}
                          className="w-full bg-dominus-black/50 border border-dominus-gold/25 rounded-lg px-4 py-3 text-dominus-text-primary focus:border-dominus-gold focus:outline-none focus:ring-1 focus:ring-dominus-gold/40 transition-colors"
                        >
                          {TIME_OPTIONS.map((opt) => (
                            <option key={opt} value={opt} className="bg-dominus-charcoal">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-2">
                        Additional Notes
                      </label>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                        placeholder="Tell us about your tax situation or any questions you have..."
                        className="w-full bg-dominus-black/50 border border-dominus-gold/25 rounded-lg px-4 py-3 text-dominus-text-primary placeholder:text-dominus-text-secondary/40 focus:border-dominus-gold focus:outline-none focus:ring-1 focus:ring-dominus-gold/40 transition-colors resize-none"
                      />
                    </div>

                    {status === 'error' && (
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-red-950/40 border border-red-700/40">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{errorMsg}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="btn-gold w-full py-4 rounded-xl text-base flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === 'submitting' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Book Appointment
                          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-montserrat text-xs uppercase tracking-wider text-dominus-text-secondary mb-2">
        {label} {required && <span className="text-dominus-gold">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dominus-black/50 border border-dominus-gold/25 rounded-lg px-4 py-3 text-dominus-text-primary placeholder:text-dominus-text-secondary/40 focus:border-dominus-gold focus:outline-none focus:ring-1 focus:ring-dominus-gold/40 transition-colors"
      />
    </div>
  );
}
