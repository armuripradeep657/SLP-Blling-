import type { Metadata, Viewport } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { ChunkGuard } from '@/components/ChunkGuard';
import './globals.css';

export const metadata: Metadata = {
  title: 'SLP Cement Works — Billing & Invoice',
  description:
    'Billing app for Sri Lakshmi Penchil Narasimha Swamy Cement Works (Proprietor: A. Prasad). Create customer bills, share thermal-slip invoice images via WhatsApp & SMS.',
  applicationName: 'SLP Billing',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SLP Billing',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1d4ed8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ChunkGuard />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
