import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://leadscout-ashy.vercel.app'),

  title: {
    default: 'LeadScout — Find Freelance Clients on Google Maps & Instagram',
    template: '%s | LeadScout',
  },

  description:
    'LeadScout helps freelancers find clients by scanning Google Maps and Instagram, analyzing digital gaps, and generating personalized pitches with AI. Find your next client in 60 seconds.',

  keywords: [
    'find freelance clients',
    'freelance lead generation',
    'client finder for freelancers',
    'google maps lead scraper',
    'instagram business leads',
    'AI pitch generator',
    'freelance outreach tool',
    'find clients for social media manager',
    'find clients for web designer',
    'freelance prospecting tool',
    'cold outreach for freelancers',
    'business gap analyzer',
    'digital marketing leads',
    'LeadScout',
  ],

  authors: [{ name: 'LeadScout' }],
  creator: 'LeadScout',
  publisher: 'LeadScout',

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

  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://leadscout-ashy.vercel.app',
    siteName: 'LeadScout',
    title: 'LeadScout — Find Freelance Clients with AI',
    description:
      'Scan Google Maps and Instagram. Find businesses with gaps. Get AI-generated pitches. Land more clients.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LeadScout — AI-powered client finder for freelancers',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'LeadScout — Find Freelance Clients with AI',
    description:
      'Scan Google Maps and Instagram. Find businesses with gaps. Get AI-generated pitches. Land more clients.',
    images: ['/og-image.png'],
    creator: '@leadscout',
  },

  alternates: {
    canonical: 'https://leadscout-ashy.vercel.app',
  },

  manifest: '/manifest.json',

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
    ],
  },

  verification: {
    google: 'your-google-verification-code',
  },
}

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
