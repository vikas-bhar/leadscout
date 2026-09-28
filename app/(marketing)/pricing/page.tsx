import { Navbar } from '@/components/marketing/Navbar'
import { Pricing } from '@/components/marketing/Pricing'
import { FAQ } from '@/components/marketing/FAQ'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'

export const metadata = {
  title: 'Pricing — Subscription Plans & Credit Packs',
  description: 'Flexible subscriptions and pay-as-you-go credit packages for LeadScout. Free plan with 20 credits. Monthly subscriptions from $19/mo with auto-refilling credits, or one-time packs from $9.',
  alternates: { canonical: 'https://leadscout-ashy.vercel.app/pricing' }
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-8">
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
