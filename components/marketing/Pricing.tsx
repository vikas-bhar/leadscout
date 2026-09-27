'use client'

import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'

export function Pricing() {
  const plans = [
    {
      name: "FREE",
      credits: "20 credits",
      price: "$0",
      subtitle: "Forever free",
      features: [
        "2 full searches",
        "Google Maps scanning",
        "AI gap analysis",
        "3 pitches per lead",
        "No credit card needed",
      ],
      cta: "Start free",
      href: "/signup",
      highlighted: false,
    },
    {
      name: "STARTER",
      credits: "100 credits",
      price: "$9",
      subtitle: "$0.09 per credit",
      features: [
        "Everything in Free",
        "5 full searches",
        "Instagram analysis",
        "Credits never expire",
        "Email support",
      ],
      cta: "Buy Starter",
      href: "/signup",
      highlighted: false,
    },
    {
      name: "PRO",
      badge: "Most popular",
      credits: "500 credits",
      price: "$29",
      subtitle: "$0.058 per credit",
      bonus: "+100 bonus credits",
      features: [
        "Everything in Starter",
        "25 full searches",
        "Gap Analyzer feature",
        "CSV export",
        "Priority support",
      ],
      cta: "Buy Pro",
      href: "/signup",
      highlighted: true,
    },
    {
      name: "AGENCY",
      credits: "2,000 credits",
      price: "$99",
      subtitle: "$0.049 per credit",
      features: [
        "Everything in Pro",
        "100 full searches",
        "3 team seats",
        "CRM dashboard",
        "Dedicated support",
      ],
      cta: "Buy Agency",
      href: "/signup",
      highlighted: false,
    },
  ]

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Simple credit-based pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Buy once. Use whenever. Credits never expire.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-12">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`bg-white dark:bg-gray-900 rounded-2xl p-6 flex flex-col justify-between relative transition-all ${
                plan.highlighted
                  ? 'border-2 border-blue-600 shadow-xl lg:-translate-y-2'
                  : 'border border-gray-200 dark:border-gray-800 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {plan.name}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    {plan.credits}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-6 font-medium">
                  {plan.subtitle} {plan.bonus && <span className="text-green-600 dark:text-green-400 font-semibold block">{plan.bonus}</span>}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={plan.href}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-center text-sm transition-all flex items-center justify-center gap-2 ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          All plans include a 20 credit free trial. No credit card needed to start.{' '}
          <Link href="#faq" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Have questions? See FAQ ↓
          </Link>
        </div>

      </div>
    </section>
  )
}
