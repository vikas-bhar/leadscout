'use client'

import { Star, MessageSquareQuote } from 'lucide-react'

export function Testimonials() {
  const testimonials = [
    {
      quote: "Found multiple local dining spots in Dubai with active foot traffic but zero mobile websites. Having specific gap data made my pitch calls far more credible and direct.",
      name: "Sarah K.",
      role: "Freelance Web Designer, Dubai",
      initials: "SK",
    },
    {
      quote: "Targeting businesses with verified Instagram gaps rather than spamming random directories made my outreach dramatically more relevant, resulting in significantly higher reply rates.",
      name: "James M.",
      role: "Social Media Strategist, London",
      initials: "JM",
    },
    {
      quote: "Instead of spending hours manually combing Google Maps for contact info, LeadScout highlights exactly who needs digital help and drafts angles I can customize in seconds.",
      name: "Priya R.",
      role: "Direct-Response Copywriter, Mumbai",
      initials: "PR",
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            Illustrative Freelancer Case Studies
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            Built for modern digital freelancers
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Representative beta experiences demonstrating how freelancers audit prospects and tailor cold outreach.
          </p>
        </div>

        {/* 3 Columns */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Beta Feedback
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-medium">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {t.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-gray-400 max-w-2xl mx-auto">
          *User feedback and quotes reflect illustrative beta testing workflows and typical personalized outreach best practices. Individual response rates depend on offer positioning, portfolio relevance, and regional outreach quality.
        </p>

      </div>
    </section>
  )
}
