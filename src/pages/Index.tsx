import { Suspense, lazy } from 'react';
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
const CinematicDivider = lazy(() => import('@/components/landing/ScrollReveal').then(m => ({ default: m.CinematicDivider })));

const SectionFallback = () => <div className="h-24" />;

const Index = () => {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)]">
      <Suspense fallback={null}>
        <MusicParticles />
      </Suspense>
      <Header />
      <main>
        <HeroSection />
        <Suspense fallback={<SectionFallback />}>
          <CinematicDivider />
          <InstrumentsSection />
          <CinematicDivider />
          <MusicProductionSection />
          <CinematicDivider />
          <CalendarSection />
          <CinematicDivider />
          <PricingSection />
          <CinematicDivider />
          <TestimonialsSection />
          <CinematicDivider />
          <FAQSection />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
