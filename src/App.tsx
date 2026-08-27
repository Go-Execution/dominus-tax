import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import Services from '@/components/Services';
import TaxAdvance from '@/components/TaxAdvance';
import WhyChoose from '@/components/WhyChoose';
import About from '@/components/About';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import TermsConditions from '@/components/TermsConditions';
import FloatingForm from '@/components/FloatingForm';
import useReveal from '@/hooks/useReveal';

export default function App() {
  useReveal();

  const [page, setPage] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#terms') return 'terms';
    if (hash === '#contact') return 'contact';
    return 'home';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#terms') {
        setPage('terms');
      } else if (hash === '#contact') {
        setPage('contact');
      } else {
        setPage('home');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Scroll to top when changing routing pages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);

  if (page === 'terms') {
    return (
      <div className="min-h-screen bg-dominus-black text-dominus-text-primary">
        <Navbar />
        <main>
          <TermsConditions />
        </main>
        <Footer />
        <FloatingForm />
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="min-h-screen bg-dominus-black text-dominus-text-primary">
        <Navbar />
        <main>
          <Contact />
        </main>
        <Footer />
        <FloatingForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dominus-black text-dominus-text-primary">
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <Services />
        <TaxAdvance />
        <WhyChoose />
        <About />
        <Testimonials />
      </main>
      <Footer />
      <FloatingForm />
    </div>
  );
}
