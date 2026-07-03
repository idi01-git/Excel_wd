// src/app/layout.tsx
import type { Metadata } from 'next';
import { Outfit, Lora, Geist } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { cn } from "@/lib/utils";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Excelsior Literary Club',
  description: 'Digital ecosystem of the Excelsior literary society. Discover articles, poetry, stories, and connect with other writers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", outfit.variable, lora.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScrollProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
