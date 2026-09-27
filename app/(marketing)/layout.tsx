import Script from 'next/script'

export default function MarketingLayout({
  children
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LeadScout',
    applicationCategory: 'BusinessApplication',
    description: 'AI-powered client finder for freelancers. Find businesses with digital gaps on Google Maps and Instagram. Get personalized pitches generated instantly.',
    url: 'https://leadscout-ashy.vercel.app',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '4',
    },
    featureList: [
      'Google Maps business scanning',
      'Instagram profile analysis',
      'AI gap detection',
      'Personalized pitch generation',
      'Credit-based pricing',
    ],
    operatingSystem: 'Web browser',
    screenshot: 'https://leadscout-ashy.vercel.app/og-image.png',
  }

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
        {children}
      </div>
    </>
  )
}
