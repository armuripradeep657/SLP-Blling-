import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SLP Cement Works - Billing',
    short_name: 'SLP Billing',
    description:
      'Billing app for Sri Lakshmi Penchil Narasimha Swamy Cement Works (Proprietor: A. Prasad). Calculate bills, print thermal slips, share invoices as images via WhatsApp & SMS.',
    id: '/',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#fffbeb',
    theme_color: '#b45309',
    lang: 'en-IN',
    categories: ['business', 'productivity', 'finance'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'New Bill',
        short_name: 'Bill',
        description: 'Start a new customer bill',
        url: '/?tab=bill',
      },
    ],
  };
}
