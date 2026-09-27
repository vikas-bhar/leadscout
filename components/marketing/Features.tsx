'use client'

import { MapPin, Camera, Brain, Target, Mail, Globe } from 'lucide-react'

export function Features() {
  const features = [
    {
      icon: <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Google Maps Scanner",
      description: "Find businesses in any city. See their rating, photos, website status, and phone number instantly.",
      tag: "Powered by Apify",
    },
    {
      icon: <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Instagram Analysis",
      description: "Check their follower count, engagement rate, last post date, and whether they use Reels. Spot dead accounts instantly.",
      tag: "Real-time data",
    },
    {
      icon: <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "AI Gap Analyzer",
      description: "Paste any Instagram or website link. Our AI gives you a full audit in seconds — no search needed.",
      tag: "New feature",
      badge: "NEW",
    },
    {
      icon: <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Opportunity Score",
      description: "Every business gets a score 0-100. See at a glance which leads are worth your time and which to skip.",
      tag: "Saves hours",
    },
    {
      icon: <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "3 Pitches per Lead",
      description: "Instagram DM, Email, and WhatsApp. Each references real data about the business. Copy and send in one click.",
      tag: "AI-generated",
    },
    {
      icon: <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      title: "Search Anywhere",
      description: "Find clients in UAE, India, UK, USA, Saudi Arabia and 100+ countries. Filter by city and neighbourhood.",
      tag: "Global",
    },
  ]

  return (
    <section id="features" className="py-20 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Everything you need to land clients
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Built specifically for freelancers
          </p>
        </div>

        {/* 3x2 Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center border border-blue-100 dark:border-blue-900 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  {feat.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      {feat.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  {feat.description}
                </p>
              </div>

              <div>
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {feat.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
