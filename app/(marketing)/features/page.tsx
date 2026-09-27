import { Navbar } from '@/components/marketing/Navbar'
import { Features } from '@/components/marketing/Features'
import { GapAnalyzerSpot } from '@/components/marketing/GapAnalyzerSpot'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'

export const metadata = {
  title: 'Features — Google Maps & Instagram Lead Generation',
  description: 'LeadScout features: Google Maps scanning, Instagram analysis, AI gap detection, personalized pitch generation, opportunity scoring, and gap analyzer.',
  alternates: { canonical: 'https://leadscout-ashy.vercel.app/features' }
}

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-8">
        <Features />
        <GapAnalyzerSpot />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
