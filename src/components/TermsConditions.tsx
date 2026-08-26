import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function TermsConditions() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="relative min-h-screen py-32 lg:py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dominus-black via-dominus-charcoal/30 to-dominus-black" />
      <div className="absolute inset-0 gold-radial opacity-15" />

      <div className="relative max-w-4xl mx-auto px-5 lg:px-8">
        {/* Back button */}
        <a
          href="#home"
          className="inline-flex items-center gap-2 text-dominus-gold hover:text-dominus-gold-light transition-colors mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-montserrat text-sm font-medium tracking-wide">Back to Home</span>
        </a>

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-dominus-text-primary">Terms &amp; </span>
            <span className="gold-text">Conditions</span>
          </h1>
          <p className="text-dominus-text-secondary text-sm">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-dominus-text-primary/75 text-base leading-relaxed">
          <div className="luxury-card rounded-2xl p-6 lg:p-8 space-y-8">
            <Section title="1. Agreement to Terms">
              <p>
                By accessing or using the services provided by Dominus Tax Consultants, LLC
                (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree
                to be bound by these Terms &amp; Conditions. If you do not agree with any part of
                these terms, you may not use our services.
              </p>
            </Section>

            <Section title="2. Services Provided">
              <p>Dominus Tax Consultants, LLC provides the following professional services:</p>
              <ul className="list-disc list-inside space-y-1 mt-3 ml-2">
                <li>Individual and business tax preparation</li>
                <li>Tax planning and strategy</li>
                <li>Tax resolution services</li>
                <li>Notary services</li>
                <li>Credit repair and restoration</li>
                <li>Tax advance facilitation (up to $7,500)</li>
                <li>Onboarding and training for tax professionals</li>
              </ul>
              <p className="mt-3">
                All services are subject to availability and may be modified or discontinued at our
                discretion without prior notice.
              </p>
            </Section>

            <Section title="3. Client Responsibilities">
              <p>As a client, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 mt-3 ml-2">
                <li>Provide accurate, complete, and truthful information for all tax filings</li>
                <li>Supply all necessary documentation in a timely manner</li>
                <li>Review all prepared returns before filing and confirm their accuracy</li>
                <li>Notify us promptly of any changes to your financial situation</li>
                <li>Pay all fees associated with services rendered</li>
              </ul>
              <p className="mt-3">
                You acknowledge that the accuracy of your tax return depends on the accuracy and
                completeness of the information you provide.
              </p>
            </Section>

            <Section title="4. Fees and Payment">
              <p>
                Service fees will be communicated prior to the commencement of work. Payment is due
                upon completion of services unless otherwise agreed in writing. We reserve the right
                to withhold completed work until full payment is received.
              </p>
              <p className="mt-3">
                Fees for tax advance facilitation are subject to third-party lender terms and
                conditions. Dominus Tax Consultants does not guarantee approval of any tax advance
                application.
              </p>
            </Section>

            <Section title="5. Confidentiality">
              <p>
                We are committed to protecting your personal and financial information. All client
                data is handled in accordance with applicable federal and state privacy laws,
                including IRS regulations governing the disclosure of tax return information. We
                will not share your information with third parties without your consent, except as
                required by law.
              </p>
            </Section>

            <Section title="6. Limitation of Liability">
              <p>
                Dominus Tax Consultants, LLC shall not be held liable for any penalties, interest,
                or additional taxes assessed by the IRS or any state taxing authority due to
                incorrect, incomplete, or misleading information provided by the client. Our
                liability is limited to the fees paid for the specific service in question.
              </p>
              <p className="mt-3">
                In no event shall we be liable for any indirect, incidental, special, consequential,
                or punitive damages arising from the use of our services.
              </p>
            </Section>

            <Section title="7. Tax Advance Disclaimer">
              <p>
                Tax advances are provided through third-party financial institutions. Dominus Tax
                Consultants acts solely as a facilitator and does not make lending decisions.
                Approval, terms, and conditions are determined entirely by the lending institution.
                We do not guarantee that you will be approved for a tax advance.
              </p>
            </Section>

            <Section title="8. Credit Repair Services">
              <p>
                Credit repair services are provided in compliance with the Credit Repair
                Organizations Act (CROA). Results are not guaranteed. Improvement in credit scores
                depends on individual circumstances, credit history, and the responsiveness of
                credit bureaus and creditors.
              </p>
            </Section>

            <Section title="9. No Legal or Financial Advice">
              <p>
                The services provided by Dominus Tax Consultants are for tax preparation and
                consulting purposes only. We do not provide legal, investment, or financial planning
                advice. For such services, we recommend consulting with a qualified professional in
                the relevant field.
              </p>
            </Section>

            <Section title="10. Intellectual Property">
              <p>
                All content, branding, logos, and materials on this website and in our communications
                are the property of Dominus Tax Consultants, LLC. Unauthorized use, reproduction,
                or distribution is prohibited without prior written consent.
              </p>
            </Section>

            <Section title="11. Dispute Resolution">
              <p>
                Any disputes arising from these terms or the services provided shall first be
                addressed through good-faith negotiation. If unresolved, disputes shall be submitted
                to binding arbitration in accordance with the laws of the state of Texas.
              </p>
            </Section>

            <Section title="12. Modifications">
              <p>
                We reserve the right to update or modify these Terms &amp; Conditions at any time.
                Changes will be effective upon posting to our website. Continued use of our services
                after modifications constitutes acceptance of the updated terms.
              </p>
            </Section>

            <Section title="13. Contact Information">
              <p>
                If you have any questions regarding these Terms &amp; Conditions, please contact us:
              </p>
              <div className="mt-4 space-y-2 text-dominus-text-primary/90">
                <p><span className="text-dominus-gold font-semibold">Dominus Tax Consultants, LLC</span></p>
                <p>Phone: <a href="tel:4322563225" className="text-dominus-gold hover:text-dominus-gold-light transition-colors">432-256-3225</a></p>
                <p>Email: <a href="mailto:dominustaxconsultantsllc@gmail.com" className="text-dominus-gold hover:text-dominus-gold-light transition-colors">dominustaxconsultantsllc@gmail.com</a></p>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-xl lg:text-2xl font-bold text-dominus-text-primary mb-3">
        {title}
      </h2>
      <div className="text-dominus-text-primary/70 leading-relaxed">{children}</div>
    </div>
  );
}
