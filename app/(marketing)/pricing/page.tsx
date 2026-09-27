import { Navbar } from '@/components/marketing/Navbar'
import { Pricing } from '@/components/marketing/Pricing'
import { FAQ } from '@/components/marketing/FAQ'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'

export const metadata = {
  title: 'Pricing — LeadScout Credit Packages',
  description: 'Simple credit-based pricing for LeadScout. Free plan with 20 credits. Starter $9, Pro $29, Agency $99. Credits never expire. No subscription required.',
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
