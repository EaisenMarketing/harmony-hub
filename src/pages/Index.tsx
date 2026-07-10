import { Suspense, lazy, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';

const InstrumentsSection = lazy(() => import('@/components/InstrumentsSection').then(m => ({ default: m.InstrumentsSection })));
const MusicProductionSection = lazy(() => import('@/components/MusicProductionSection').then(m => ({ default: m.MusicProductionSection })));
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
      const requestIdle = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 600));
      const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
      const id = requestIdle(() => setEnabled(true), { timeout: 2500 });
      return () => cancelIdle(id as number);
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
    const requestIdle = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => window.setTimeout(callback, 800));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const id = requestIdle(() => setShowSections(true), { timeout: 1800 });
    return () => cancelIdle(id as number);
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
    </Suspense>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)]">
      <DeferredLandingEffects />
      <Header />
      <main>
        <HeroSection />
        <DeferredLandingSections />
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
