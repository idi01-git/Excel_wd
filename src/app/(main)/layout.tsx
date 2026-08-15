// src/app/(main)/layout.tsx
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-grow w-full">
        {children}
      </main>
      <Footer />
    </>
  );
}
