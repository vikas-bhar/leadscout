'use client'

import { Star } from 'lucide-react'

export function Testimonials() {
  const testimonials = [
    {
      quote: "I found 12 restaurants in Dubai that needed a website in one search. Closed my first client within 48 hours of signing up.",
      name: "Sarah K.",
      role: "Web Designer, Dubai",
      initials: "SK",
    },
    {
      quote: "The pitches are scary good. They reference real data about each business. My response rate went from 2% to 18%.",
      name: "James M.",
      role: "Social Media Manager, London",
      initials: "JM",
    },
    {
      quote: "I wasted months cold emailing random businesses. LeadScout shows me exactly who needs my services and what to say. Game changer.",
      name: "Priya R.",
      role: "Copywriter, Mumbai",
      initials: "PR",
    },
  ]

  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Freelancers love LeadScout
          </h2>
        </div>

        {/* 3 Columns */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
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
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
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

      </div>
    </section>
  )
}
