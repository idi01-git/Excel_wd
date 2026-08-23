// src/app/(main)/layout.tsx
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 w-full min-h-[calc(100vh-80px)]">
        {children}
      </main>
      <Footer />
    </div>
  );
}
