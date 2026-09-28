'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ArrowRight, Sparkles, Calendar, Coins, Zap } from 'lucide-react'

export function Pricing() {
  const [billingTab, setBillingTab] = useState<'subscription' | 'packs'>('subscription')
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'FREE TIER',
      credits: '20 credits',
      monthlyPrice: 0,
      annualMonthlyPrice: 0,
      badge: 'Starter',
      subtitle: 'Forever free to test LeadScout',
      description: 'Ideal for trying out the scanner on local niche businesses.',
      features: [
        '20 discovery credits included',
        '~2 complete business scans',
        'Google Maps local search',
        'Basic AI gap analysis',
        '3 personalized pitches per lead',
        'Standard search filters',
        'No credit card required',
      ],
      cta: 'Start with 20 Free Credits',
      href: '/signup',
      highlighted: false,
    },
    {
      id: 'freelancer',
      name: 'FREELANCER',
      credits: '300 credits/mo',
      monthlyPrice: 19,
      annualMonthlyPrice: 15,
      badge: 'Affordable',
      subtitle: 'Auto-refilled every month',
      description: 'Perfect for solo freelancers pitching 10-15 prospects weekly.',
      features: [
        '300 credits replenished every month',
        '~12 deep client searches',
        'Google Maps & Instagram deep scan',
        'Full AI Gap Analyzer',
        'Personalized multi-angle pitches',
        'Custom niche & location filters',
        'Email & chat support',
      ],
      cta: 'Choose Freelancer',
      href: '/signup?plan=freelancer',
      highlighted: false,
    },
    {
      id: 'growth',
      name: 'GROWTH',
      credits: '1,000 credits/mo',
      monthlyPrice: 49,
      annualMonthlyPrice: 39,
      badge: 'Most Popular ⭐',
      subtitle: 'For active freelancers & small studios',
      description: 'Scale outreach with custom AI tones, filters, and rollover.',
      features: [
        '1,000 credits replenished every month',
        '~40 deep client searches',
        'Everything in Freelancer',
        'Unlimited Gap Analyzer reports',
        'Custom AI prompts & tone presets',
        'One-click CSV lead export',
        'Unused credit rollover (up to 500)',
        'Priority email & webhook alerts',
      ],
      cta: 'Start Growth Plan',
      href: '/signup?plan=growth',
      highlighted: true,
    },
    {
      id: 'agency',
      name: 'AGENCY',
      credits: '3,000 credits/mo',
      monthlyPrice: 99,
      annualMonthlyPrice: 79,
      badge: 'Best For Teams',
      subtitle: 'For outreach teams & digital agencies',
      description: 'High-volume lead generation with multi-seat collaboration.',
      features: [
        '3,000 credits replenished every month',
        '~120 deep client searches',
        '5 team member seats included',
        'Shared custom prompt studio',
        'White-label PDF/pitch export',
        'Full unlimited credit rollover',
        'API & Zapier integration',
        'Dedicated account manager',
      ],
      cta: 'Start Agency Plan',
      href: '/signup?plan=agency',
      highlighted: false,
    },
  ]

  const creditPacks = [
    {
      name: 'STARTER PACK',
      credits: '100 credits',
      price: '$9',
      subtitle: '$0.090 per credit',
      description: 'Great for a quick weekend outreach sprint.',
      features: [
        '100 one-time credits',
        '~5 deep prospect searches',
        'Google Maps scanning',
        'AI gap audits & pitch drafts',
        'Credits never expire',
        'One-time payment, no recurring charge',
      ],
      cta: 'Buy Starter Pack',
      href: '/signup',
      highlighted: false,
    },
    {
      name: 'PRO PACK',
      badge: 'Best Value Pack',
      credits: '600 credits',
      price: '$29',
      subtitle: '$0.048 per credit',
      bonus: '+100 bonus credits included',
      description: 'Our most popular pay-as-you-go bundle.',
      features: [
        '500 credits + 100 free bonus credits',
        '~25 deep prospect searches',
        'Instagram social presence audit',
        'Gap Analyzer feature unlocked',
        'CSV export capability',
        'Credits never expire',
      ],
      cta: 'Buy Pro Pack',
      href: '/signup',
      highlighted: true,
    },
    {
      name: 'AGENCY PACK',
      credits: '2,000 credits',
      price: '$99',
      subtitle: '$0.049 per credit',
      description: 'Heavy outreach volume with team flexibility.',
      features: [
        '2,000 credits in your balance',
        '~100 deep prospect searches',
        '3 team member access',
        'Full Gap Analyzer access',
        'Direct CSV exports',
        'Credits never expire',
      ],
      cta: 'Buy Agency Pack',
      href: '/signup',
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gray-50/60 dark:bg-gray-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-4 border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Transparent Pricing • 20 Free Credits To Start</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
            Subscription plans built for client acquisition
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Choose a recurring subscription for monthly auto-refills and advanced AI features, or pick a one-time credit pack that never expires.
          </p>
        </div>

        {/* Primary Tab Switcher: Subscriptions vs Credit Packs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-gray-200/80 dark:bg-gray-800 border border-gray-300/80 dark:border-gray-700 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingTab('subscription')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                billingTab === 'subscription'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Monthly Subscriptions (Best Value)</span>
            </button>
            <button
              type="button"
              onClick={() => setBillingTab('packs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                billingTab === 'packs'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Pay-As-You-Go Packs</span>
            </button>
          </div>

          {/* Annual Toggle for Subscription Tab */}
          {billingTab === 'subscription' && (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-semibold">
              <span className={billingInterval === 'month' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500'}>
                Monthly
              </span>
              <button
                type="button"
                aria-label="Toggle annual billing"
                onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                className="w-10 h-5 rounded-full bg-gray-200 dark:bg-gray-700 p-0.5 transition-colors relative"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-blue-600 transition-transform ${
                    billingInterval === 'year' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={billingInterval === 'year' ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500'}>
                Annual
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                Save ~20%
              </span>
            </div>
          )}
        </div>

        {/* VIEW 1: SUBSCRIPTION PLANS */}
        {billingTab === 'subscription' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-12">
            {subscriptionPlans.map((plan) => {
              const displayPrice = billingInterval === 'year' ? plan.annualMonthlyPrice : plan.monthlyPrice
              return (
                <div
                  key={plan.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                    plan.highlighted
                      ? 'border-2 border-blue-600 shadow-xl lg:-translate-y-2 ring-2 ring-blue-500/20'
                      : 'border border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {plan.name}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                        {plan.credits}
                      </span>
                    </div>

                    <div className="mb-1 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                        ${displayPrice}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-xs text-gray-500 font-medium">/month</span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                      {plan.subtitle}
                      {billingInterval === 'year' && plan.monthlyPrice > 0 && (
                        <span className="text-green-600 dark:text-green-400 font-semibold block text-[11px]">
                          Billed annually (${displayPrice * 12}/yr)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mb-6">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">
                        Features Included
                      </span>
                      <ul className="space-y-2.5">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    href={plan.href}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-center text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                      plan.highlighted
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* VIEW 2: ONE-TIME CREDIT PACKS */}
        {billingTab === 'packs' && (
          <div className="grid md:grid-cols-3 gap-6 items-stretch mb-12 max-w-5xl mx-auto">
            {creditPacks.map((pack, idx) => (
              <div
                key={idx}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                  pack.highlighted
                    ? 'border-2 border-blue-600 shadow-xl ring-2 ring-blue-500/20'
                    : 'border border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300'
                }`}
              >
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow">
                    {pack.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {pack.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {pack.credits}
                    </span>
                  </div>

                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                      {pack.price}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">one-time</span>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
                    {pack.subtitle}
                    {pack.bonus && (
                      <span className="text-green-600 dark:text-green-400 font-semibold block text-[11px]">
                        {pack.bonus}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                    {pack.description}
                  </p>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mb-6">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2.5">
                      Pack Details
                    </span>
                    <ul className="space-y-2.5">
                      {pack.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href={pack.href}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-center text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                    pack.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <span>{pack.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Value Proposition Highlight Banner */}
        <div className="rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-6 max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                All accounts start with 20 Free Credits
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Scan your first leads and preview AI gap analyses before choosing a subscription or credit pack.
              </p>
            </div>
          </div>
          <Link
            href="/signup"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shrink-0 shadow-sm"
          >
            Claim 20 Free Credits
          </Link>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Need a custom agency plan or bulk queries?{' '}
          <Link href="#faq" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Read our FAQ
          </Link>{' '}
          or contact us anytime.
        </div>

      </div>
    </section>
  )
}
