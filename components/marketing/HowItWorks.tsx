'use client'

import { Search, Radio, Brain, Mail } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Tell us what you're looking for",
      description: "Choose your freelancer type, business category, and location. Set how many results you want."
    },
    {
      num: '02',
      icon: <Radio className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "We scan Google Maps & Instagram",
      description: "Our AI scrapes real business data — ratings, websites, Instagram activity, photos, reviews. All in under 60 seconds."
    },
    {
      num: '03',
      icon: <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "AI finds the gaps",
      description: "Every business gets an opportunity score. We identify exactly what they are missing and why it is costing them."
    },
    {
      num: '04',
      icon: <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      title: "Copy your personalized pitch",
      description: "Get 3 ready-to-send messages — Instagram DM, Email, and WhatsApp. Each one references their real data."
    },
  ]

  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            From search to pitch in 4 steps
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No manual research. No generic templates.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm relative flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center border border-blue-100 dark:border-blue-900">
                    {step.icon}
                  </div>
                  <span className="text-3xl font-extrabold text-gray-200 dark:text-gray-800 font-mono">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
