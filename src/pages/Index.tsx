import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { InstrumentsSection } from '@/components/InstrumentsSection';
import { MusicProductionSection } from '@/components/MusicProductionSection';
import { CalendarSection } from '@/components/CalendarSection';
import { PricingSection } from '@/components/PricingSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { FAQSection } from '@/components/FAQSection';
import { Footer } from '@/components/Footer';
import { MusicParticles } from '@/components/landing/MusicParticles';
import { CinematicDivider } from '@/components/landing/ScrollReveal';

const Index = () => {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)]">
      <MusicParticles />
      <Header />
      <main>
        <HeroSection />
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
