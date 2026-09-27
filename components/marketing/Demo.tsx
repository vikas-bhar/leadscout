'use client'

import Link from 'next/link'
import { MapPin, Star, ArrowRight } from 'lucide-react'

export function Demo() {
  const leads = [
    {
      name: "Spice Garden Restaurant",
      location: "Dubai, UAE",
      score: 94,
      badge: "CRITICAL",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200",
      tags: ["No website", "No Instagram"],
      rating: "3.2",
      pitch: "Hey, I was looking for restaurants in Al Barsha and noticed Spice Garden doesn't have a website yet...",
    },
    {
      name: "Glow Beauty Salon",
      location: "Mumbai, India",
      score: 87,
      badge: "HIGH",
      badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200",
      tags: ["Dead Instagram", "4 months ago"],
      rating: "4.1",
      pitch: "Your salon has 128 reviews but hasn't posted on Instagram in 4 months. Competitors with daily posts are...",
    },
    {
      name: "The Corner Cafe",
      location: "London, UK",
      score: 76,
      badge: "MEDIUM",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200",
      tags: ["No Reels", "Low engagement"],
      rating: "4.3",
      pitch: "The Corner Cafe has 2,400 followers but only 0.4% engagement. The industry average is 2.1%...",
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            See it in action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Real results from real searches
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {leads.map((lead, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                      {lead.name}
                    </h3>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>{lead.location}</span>
                      <span>•</span>
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span>{lead.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${lead.badgeColor} mb-1 uppercase`}>
                      {lead.badge}
                    </span>
                    <span className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                      {lead.score}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {lead.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 mb-6">
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    &ldquo;{lead.pitch}&rdquo;
                  </p>
                </div>
              </div>

              <Link 
                href="/signup" 
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>View pitch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-all"
          >
            Find leads like these
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  )
}
