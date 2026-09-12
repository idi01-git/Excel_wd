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
import { Suspense } from 'react';
import SessionProvider from '@/components/providers/SessionProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { cn } from "@/lib/utils";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import TopProgressBar from "@/components/ui/TopProgressBar";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

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

import JsonLd from '@/components/seo/JsonLd';
import { SITE_URL, DEFAULT_SEO, generateOrganizationSchema, generateWebSiteSchema, generateFaqSchema } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_SEO.title,
    template: DEFAULT_SEO.titleTemplate,
  },
  description: DEFAULT_SEO.description,
  keywords: DEFAULT_SEO.keywords,
  authors: [{ name: DEFAULT_SEO.author, url: DEFAULT_SEO.social.collegeUrl }],
  creator: DEFAULT_SEO.author,
  publisher: DEFAULT_SEO.publisher,
  formatDetection: {
    email: true,
    telephone: true,
    address: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    url: SITE_URL,
    siteName: DEFAULT_SEO.siteName,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/favicon.ico',
        width: 1200,
        height: 630,
        alt: 'Excelsior - The Literary Club of IET Lucknow',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    images: ['/favicon.ico'],
    creator: '@iet_excelsior',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
        <JsonLd data={[generateOrganizationSchema(), generateWebSiteSchema(), generateFaqSchema()]} />
        <Analytics />
        <SpeedInsights />
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
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
