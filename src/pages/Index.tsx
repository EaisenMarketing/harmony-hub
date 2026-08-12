import { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { resolveDestination } from '@/lib/auth-redirect';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';

const LiveExperienceSection = lazy(() => import('@/components/LiveExperienceSection').then(m => ({ default: m.LiveExperienceSection })));

const CalendarSection = lazy(() => import('@/components/CalendarSection').then(m => ({ default: m.CalendarSection })));
const PricingSection = lazy(() => import('@/components/PricingSection').then(m => ({ default: m.PricingSection })));
const TestimonialsSection = lazy(() => import('@/components/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const FAQSection = lazy(() => import('@/components/FAQSection').then(m => ({ default: m.FAQSection })));
const Footer = lazy(() => import('@/components/Footer').then(m => ({ default: m.Footer })));
const MusicParticles = lazy(() => import('@/components/landing/MusicParticles').then(m => ({ default: m.MusicParticles })));

const SectionFallback = () => <div className="h-24" />;

const Divider = () => (
  <div className="relative h-24 flex items-center justify-center overflow-hidden" aria-hidden="true">
    <div className="h-px w-full max-w-md gradient-bg" />
    <div className="absolute h-3 w-3 rounded-full gradient-bg" />
  </div>
);

const DeferredLandingEffects = () => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)').matches) return;
    const start = () => {
      if (window.requestIdleCallback) {
        const id = window.requestIdleCallback(() => setEnabled(true), { timeout: 2500 });
        return () => window.cancelIdleCallback?.(id);
      }
      const id = window.setTimeout(() => setEnabled(true), 600);
      return () => window.clearTimeout(id);
    };

    if (document.readyState === 'complete') return start();
    let cleanup: (() => void) | undefined;
    const onLoad = () => {
      cleanup = start();
    };
    window.addEventListener('load', onLoad, { once: true });
    return () => {
      window.removeEventListener('load', onLoad);
      cleanup?.();
    };
  }, []);

  if (!enabled) return null;
  return (
    <Suspense fallback={null}>
      <MusicParticles />
    </Suspense>
  );
};

const DeferredLandingSections = () => {
  const [showSections, setShowSections] = useState(false);

  useEffect(() => {
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(() => setShowSections(true), { timeout: 1800 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setShowSections(true), 800);
    return () => window.clearTimeout(id);
  }, []);

  if (!showSections) return <SectionFallback />;

  return (
    <Suspense fallback={<SectionFallback />}>
      <Divider />
      <InstrumentsSection />
      <Divider />
      <MusicProductionSection />
      <Divider />
      <CalendarSection />
      <Divider />
      <PricingSection />
      <Divider />
      <TestimonialsSection />
      <Divider />
      <FAQSection />
      <Footer />
    </Suspense>
  );
};

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const redirectIfVerified = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email_confirmed_at) return;
      const dest = await resolveDestination(user.id);
      if (isMounted) navigate(dest, { replace: true });
    };

    redirectIfVerified();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const user = session?.user;
        if (user && user.email_confirmed_at) {
          redirectIfVerified();
        }
      }
    });
    subscription = data.subscription;

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)]">
      <DeferredLandingEffects />
      <Header />
      <main>
        <HeroSection />
        <DeferredLandingSections />
      </main>
    </div>
  );
};

export default Index;
