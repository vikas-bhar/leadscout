import { Navbar } from '@/components/marketing/Navbar'
import { Hero } from '@/components/marketing/Hero'
import { Ticker } from '@/components/marketing/Ticker'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { Features } from '@/components/marketing/Features'
import { Demo } from '@/components/marketing/Demo'
import { ForFreelancers } from '@/components/marketing/ForFreelancers'
import { Pricing } from '@/components/marketing/Pricing'
import { Testimonials } from '@/components/marketing/Testimonials'
import { GapAnalyzerSpot } from '@/components/marketing/GapAnalyzerSpot'
import { FAQ } from '@/components/marketing/FAQ'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'

export const metadata = {
  title: 'LeadScout — Find Freelance Clients on Google Maps & Instagram',
  description: 'Scan Google Maps and Instagram with AI. Find businesses missing a website, dead Instagram, poor reviews. Get a ready-to-send pitch in 60 seconds.',
  alternates: {
    canonical: 'https://leadscout-ashy.vercel.app',
  },
}

export default function MarketingHomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <HowItWorks />
        <Features />
        <Demo />
        <ForFreelancers />
        <Pricing />
        <Testimonials />
        <GapAnalyzerSpot />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
