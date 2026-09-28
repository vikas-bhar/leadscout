'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function FAQ() {
  const faqs = [
    {
      q: "How does LeadScout find businesses?",
      a: "We use Apify to scan Google Maps for businesses matching your search. We check their rating, photos, website, and then cross-reference their Instagram presence. All public data, fully legal."
    },
    {
      q: "Is the data accurate and up to date?",
      a: "We pull data directly from Google Maps and Instagram in real time when you run a search. Results are as fresh as the platforms themselves."
    },
    {
      q: "What types of freelancers can use this?",
      a: "Any freelancer who offers digital services: social media managers, web designers, graphic designers, video editors, copywriters, SEO specialists, photographers, and more."
    },
    {
      q: "Do credits expire, and how do subscriptions work?",
      a: "One-time credit packs never expire and remain in your account until you use them. For recurring subscriptions (Freelancer $19/mo, Growth $49/mo, Agency $99/mo), fresh credits are automatically replenished every month, and unused credits roll over according to your plan tier (up to 500 on Growth, unlimited on Agency)."
    },
    {
      q: "What countries and cities does it cover?",
      a: "Any city where Google Maps has business listings. We work best in UAE, India, UK, USA, Saudi Arabia, Pakistan, Australia, and Canada but it works globally."
    },
    {
      q: "How is the AI pitch generated?",
      a: "Our AI analyzes the specific gaps in each business and writes a personalized pitch using real data points — like their follower count, last post date, or missing website. Not a template. A real personalized message."
    },
    {
      q: "Can I try before buying?",
      a: "Yes. You get 20 free credits on signup. No credit card required. That gives you about 2 full searches with AI analysis and pitches."
    },
    {
      q: "Is scraping legal?",
      a: "We only collect publicly available business information from Google Maps and Instagram. This is consistent with how search engines and business directories work."
    },
  ]

  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div 
                key={idx}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 dark:text-white flex items-center justify-between gap-4"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
