import { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(222,47%,5%)] flex flex-col">
      <Header />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </div>
  );
}
