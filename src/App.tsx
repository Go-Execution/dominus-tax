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
import useReveal from '@/hooks/useReveal';

export default function App() {
  useReveal();

  const [page, setPage] = useState(() =>
    window.location.hash === '#terms' ? 'terms' : 'home'
  );

  useEffect(() => {
    const onHashChange = () => {
      setPage(window.location.hash === '#terms' ? 'terms' : 'home');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (page === 'terms') {
    return (
      <div className="min-h-screen bg-dominus-black text-dominus-text-primary">
        <Navbar />
        <main>
          <TermsConditions />
        </main>
        <Footer />
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
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
