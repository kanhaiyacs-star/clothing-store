import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { StoreProvider } from '@/context/StoreContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ThreadCraft | Premium Menswear & Custom Shirt Studio',
  description:
    'Luxury Egyptian cotton formal shirts and Californian Supima cotton T-shirts. Personalize eligible shirts with custom text, monograms, and logos with real-time preview.',
  keywords: [
    'formal shirts India',
    'custom monogram shirts',
    'personalised t-shirts',
    'Egyptian cotton shirts',
    'Supima cotton tees',
    'ThreadCraft',
    'menswear India',
  ],
  openGraph: {
    title: 'ThreadCraft | Tailored Menswear & Personalization Studio',
    description: 'Bespoke custom shirts and luxury menswear crafted for elegance.',
    url: 'https://threadcraft.in',
    siteName: 'ThreadCraft',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <StoreProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
