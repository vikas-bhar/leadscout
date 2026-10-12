'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Minus } from 'lucide-react'

export function FAQ() {
  const faqs = [
    {
      q: "How does LeadScout find businesses?",
      a: "We scan public Google Maps directory listings for local businesses matching your target niche and location. We inspect review totals, rating trends, photo counts, and website presence, then cross-reference linked public Instagram profiles to detect real marketing gaps."
    },
    {
      q: "Is the data accurate and up to date?",
      a: "We pull live directory and profile data directly in real time whenever you run a search. Results reflect current public listings as published on the source platforms."
    },
    {
      q: "What types of freelancers can use this?",
      a: "Any freelancer offering commercial digital services: web designers, social media managers, SEO specialists, video editors, copywriters, local photographers, and creative agencies."
    },
    {
      q: "Do credits expire, and how do subscriptions work?",
      a: "Pay-as-you-go credit top-up packs never expire and stay in your wallet indefinitely. For monthly subscriptions (Freelancer $19/mo, Growth $49/mo, Agency $99/mo), credits replenish at each monthly billing cycle. Unused subscription credits roll over (up to 500 on Growth, up to 1,500 on Agency) as long as your membership is active."
    },
    {
      q: "How many scans can I run on the Free Tier?",
      a: "You receive 20 free starter discovery credits upon signup (no credit card required). That lets you run up to 2 instant standard searches (10 credits each, analyzing 5-10 leads) or 1 full multi-point deep audit with tailored outreach pitches."
    },
    {
      q: "What countries and cities does it cover?",
      a: "Any city or territory where public business directory listings exist. Popular locations include the United Arab Emirates, Saudi Arabia, the United Kingdom, the United States, India, Australia, and Canada."
    },
    {
      q: "How does the AI generate personalized pitches?",
      a: "Our AI analyzes the specific gaps identified for each business (e.g., missing mobile-responsive website, 120+ reviews with no online booking flow, or inactive social presence) and drafts tailored email and Instagram DM scripts referencing those exact metrics rather than generic templates."
    },
    {
      q: "Is collecting publicly available business data permitted?",
      a: "LeadScout aggregates publicly published commercial directory listings that businesses voluntarily make available for customer discovery. We do not access private accounts, bypass authentication, or collect private consumer information. Because regional marketing regulations (such as CAN-SPAM, GDPR, and UK PECR) govern commercial outreach, we advise reviewing your local compliance guidelines before sending direct communications."
    },
    {
      q: "Do you offer an Agency plan for teams?",
      a: "Yes! Our Agency Plan ($99/mo or $79/mo billed annually) includes 2,500 credits per month, up to 5 team member seats, priority proxy runners, unlimited Gap Analyzer reports, CSV exports, and rollover of up to 1,500 unused credits."
    },
  ]

  // Allow multiple open items or toggling all
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true, 3: true, 4: true })

  const toggleItem = (idx: number) => {
    setOpenItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }))
  }

  const expandAll = () => {
    const all: Record<number, boolean> = {}
    faqs.forEach((_, i) => { all[i] = true })
    setOpenItems(all)
  }

  const collapseAll = () => {
    setOpenItems({})
  }

  const isAllOpen = Object.keys(openItems).length === faqs.length && Object.values(openItems).every(Boolean)

  return (
    <section id="faq" className="py-20 lg:py-32 bg-white dark:bg-gray-950 scroll-mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Frequently asked questions
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Have questions or need dedicated onboarding assistance? Email our team anytime at{" "}
            <a href="mailto:support@leadscout.app" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              support@leadscout.app
            </a>
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={isAllOpen ? collapseAll : expandAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {isAllOpen ? (
                <>
                  <Minus className="w-3.5 h-3.5" />
                  Collapse All
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Expand All Answers
                </>
              )}
            </button>
          </div>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = Boolean(openItems[idx])
            return (
              <div 
                key={idx}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-4 text-left font-semibold text-gray-900 dark:text-white flex items-center justify-between gap-4 hover:bg-gray-100/60 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-base font-semibold">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
