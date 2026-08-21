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
import useReveal from '@/hooks/useReveal';

export default function App() {
  useReveal();

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
