import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { InstrumentsSection } from '@/components/InstrumentsSection';
import { CalendarSection } from '@/components/CalendarSection';
import { PricingSection } from '@/components/PricingSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { FAQSection } from '@/components/FAQSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <InstrumentsSection />
        <CalendarSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
