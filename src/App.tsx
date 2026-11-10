import { lazy, Suspense, useState, useEffect, type ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import Services from '@/components/Services';
import TaxAdvance from '@/components/TaxAdvance';
import WhyChoose from '@/components/WhyChoose';
import About from '@/components/About';
import Booking from '@/components/Booking';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import TermsConditions from '@/components/TermsConditions';
import FloatingForm from '@/components/FloatingForm';
import useReveal from '@/hooks/useReveal';
import LeadPathways from '@/components/LeadPathways';
import { isHomeAnchor, navigateTo, pageFromHash } from '@/lib/navigation';

const AdminDashboard = lazy(() => import('@/components/AdminDashboard'));
const BlogList = lazy(() => import('@/components/BlogList'));
const BlogPost = lazy(() => import('@/components/BlogPost'));

function PageLoading() {
  return <div className="flex min-h-[60vh] items-center justify-center text-sm text-dominus-gold" role="status">Loading…</div>;
}

function WebsiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dominus-black text-dominus-text-primary">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[200] -translate-y-20 rounded-lg bg-dominus-gold px-4 py-2 font-semibold text-dominus-black transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <Footer />
      <FloatingForm />
    </div>
  );
}

export default function App() {
  useReveal();

  const [page, setPage] = useState(() => pageFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setPage(pageFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (page === 'home' && isHomeAnchor(hash)) {
      const frame = window.requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
      return () => window.cancelAnimationFrame(frame);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page]);

  useEffect(() => {
    const title = page === 'admin'
      ? 'Dominus 360 CRM | Dominus Tax Consultants'
      : page === 'blog' || page.startsWith('#blog/')
        ? 'Tax Resources | Dominus Tax Consultants'
        : page === 'contact'
          ? 'Contact Dominus Tax Consultants'
          : page === 'terms'
            ? 'Terms & Conditions | Dominus Tax Consultants'
            : 'Dominus Tax Consultants | The Power Behind Your Financial Success';
    document.title = title;
  }, [page]);

  if (page === 'terms') {
    return <WebsiteShell><TermsConditions /></WebsiteShell>;
  }

  if (page === 'admin') {
    return <Suspense fallback={<PageLoading />}><AdminDashboard /></Suspense>;
  }

  if (page === 'contact') {
    return <WebsiteShell><Contact /><Booking /></WebsiteShell>;
  }

  const handleNavigate = (path: string) => {
    navigateTo(path);
  };

  if (page === 'blog') {
    return <WebsiteShell><Suspense fallback={<PageLoading />}><BlogList onNavigate={handleNavigate} /></Suspense></WebsiteShell>;
  }

  if (page.startsWith('#blog/')) {
    const blogId = page.replace('#blog/', '');
    return <WebsiteShell><Suspense fallback={<PageLoading />}><BlogPost id={blogId} onNavigate={handleNavigate} /></Suspense></WebsiteShell>;
  }

  return (
    <WebsiteShell>
        <Hero />
        <TrustBar />
        <LeadPathways />
        <Services />
        <About />
        <TaxAdvance />
        <WhyChoose />
        <Booking />
        <Testimonials />
    </WebsiteShell>
  );
}
