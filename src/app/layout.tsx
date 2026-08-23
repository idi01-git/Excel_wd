// src/app/layout.tsx
import type { Metadata } from 'next';
import {
  Outfit,
  Lora,
  Geist,
  Geist_Mono,
  Playfair_Display,
  Rozha_One,
  Martel,
  Noto_Serif_Devanagari,
  Cormorant_Garamond,
} from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { cn } from "@/lib/utils";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
});

const rozhaOne = Rozha_One({
  subsets: ['devanagari', 'latin'],
  weight: '400',
  variable: '--font-rozha',
  display: 'swap',
  preload: false,
});

const martel = Martel({
  subsets: ['devanagari', 'latin'],
  weight: ['400', '700'],
  variable: '--font-martel',
  display: 'swap',
  preload: false,
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '700'],
  variable: '--font-noto-devanagari',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'Excelsior Literary Club',
  description: 'Digital ecosystem of the Excelsior literary society. Discover articles, poetry, stories, and connect with other writers.',
  icons: {
    icon: '/favicon.ico',
  },
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
      className={cn(
        "h-full",
        "antialiased",
        outfit.variable,
        lora.variable,
        playfair.variable,
        cormorant.variable,
        rozhaOne.variable,
        martel.variable,
        notoSerifDevanagari.variable,
        geistSans.variable,
        geistMono.variable,
        "font-sans"
      )}
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
