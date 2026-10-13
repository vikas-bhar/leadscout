'use client'

import { MessageSquareQuote, Compass, Sparkles, Briefcase } from 'lucide-react'

// Replace with real, permissioned testimonials when available.
export function Testimonials() {
  const exampleScenarios = [
    {
      badge: "Example Scenario • Web Design",
      title: "Auditing Local Venues Without Websites",
      description: "Scanning dining spots and retail stores on Google Maps that have strong local foot traffic and 4+ star reviews, but lack an active website or mobile menu. Using LeadScout to draft an audit-backed website proposal in under 60 seconds.",
      persona: "Web Designer Workflow",
      icon: Briefcase,
    },
    {
      badge: "Example Scenario • Social Media",
      title: "Targeting Inactive Instagram Presence",
      description: "Identifying service businesses and boutique shops with high customer interest whose Instagram profiles are dormant or missing link-in-bio setups. Pitching a 30-day content calendar and reel strategy tailored to their audience.",
      persona: "Social Strategist Workflow",
      icon: Sparkles,
    },
    {
      badge: "Example Scenario • Direct Response",
      title: "Cold Outreach with Verified Gap Data",
      description: "Replacing generic 'buy my services' cold emails with LeadScout's specific gap diagnosis. Highlighting unoptimized listing metadata, missing WhatsApp triggers, and conversion roadblocks to show instant value before the call.",
      persona: "Copywriter & Consultant Workflow",
      icon: Compass,
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            Practical Use Cases
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            How freelancers use LeadScout
          </h2>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Representative workflows demonstrating how freelance designers, copywriters, and marketers discover prospects and craft tailored outreach.
          </p>
        </div>

        {/* 3 Columns */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {exampleScenarios.map((scenario, idx) => {
            const Icon = scenario.icon
            return (
              <div 
                key={idx}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full">
                      {scenario.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2.5">
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {scenario.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-sm shadow-xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                      {scenario.persona}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Standard workflow
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footnote */}
        <p className="text-center text-[11px] text-gray-400 max-w-2xl mx-auto">
          *Illustrative workflow examples. Individual response rates depend on offer positioning, portfolio relevance, and regional outreach quality.
        </p>

      </div>
    </section>
  )
}
