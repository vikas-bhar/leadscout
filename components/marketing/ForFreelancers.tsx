'use client'

import { useState } from 'react'

export function ForFreelancers() {
  const roles = [
    {
      id: 'smm',
      name: 'Social Media Manager',
      whatTheyFind: 'Businesses with no Instagram or dead social media accounts with zero posting activity.',
      bestPitchAngle: 'I help restaurants grow their Instagram following by 300% in 90 days with daily reels.',
      avgDealSize: '$500 - $2,000 / month',
      industries: 'Restaurants, Salons, Cafes, Gyms',
    },
    {
      id: 'web',
      name: 'Web Designer',
      whatTheyFind: 'Local businesses without any website or with broken, non-mobile-friendly sites.',
      bestPitchAngle: 'I build high-converting websites that turn Google Maps visitors into paying customers.',
      avgDealSize: '$1,000 - $3,500 / project',
      industries: 'Clinics, Contractors, Spas, Law firms',
    },
    {
      id: 'graphic',
      name: 'Graphic Designer',
      whatTheyFind: 'Brands with outdated logos, inconsistent branding, and poor visual content.',
      bestPitchAngle: 'I modernize brand identities to instantly build trust and premium positioning.',
      avgDealSize: '$500 - $2,000 / project',
      industries: 'E-commerce, Boutiques, Startups',
    },
    {
      id: 'video',
      name: 'Video Editor',
      whatTheyFind: 'Companies with great locations but zero short-form video content or Reels.',
      bestPitchAngle: 'I turn raw phone footage into viral TikToks and Reels that drive foot traffic.',
      avgDealSize: '$800 - $3,000 / month',
      industries: 'Fitness studios, Hotels, Cafes',
    },
    {
      id: 'copy',
      name: 'Copywriter',
      whatTheyFind: 'Websites with unclear messaging, poor headlines, and missing calls to action.',
      bestPitchAngle: 'I rewrite your website copy to double your conversion rate in 30 days.',
      avgDealSize: '$600 - $2,500 / project',
      industries: 'SaaS, Agencies, Service businesses',
    },
    {
      id: 'photo',
      name: 'Photographer',
      whatTheyFind: 'Listings with low-res, blurry, or missing Google Maps photos.',
      bestPitchAngle: 'I capture professional food & interior photography that fills tables on weekends.',
      avgDealSize: '$400 - $1,500 / shoot',
      industries: 'Restaurants, Airbnb hosts, Hotels',
    },
    {
      id: 'seo',
      name: 'SEO Specialist',
      whatTheyFind: 'Local businesses not ranking on page 1 of Google Maps for local searches.',
      bestPitchAngle: 'I optimize your Google Business profile so local customers find you first.',
      avgDealSize: '$750 - $2,500 / month',
      industries: 'Dentists, Plumbers, Real estate',
    },
  ]

  const [activeRole, setActiveRole] = useState(roles[0])

  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Built for every type of freelancer
          </h2>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-2 justify-start lg:justify-center no-scrollbar">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeRole.id === role.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>

        {/* Tab Content Card */}
        <div className="max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                What you find
              </h3>
              <p className="text-gray-900 dark:text-white text-base font-medium mb-6">
                {activeRole.whatTheyFind}
              </p>

              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                Best pitch angle
              </h3>
              <p className="text-gray-900 dark:text-white text-base font-medium italic">
                &ldquo;{activeRole.bestPitchAngle}&rdquo;
              </p>
            </div>

            <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-800 pt-6 md:pt-0 md:pl-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                  Average deal size
                </h3>
                <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 font-mono">
                  {activeRole.avgDealSize}
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                  Best industries
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {activeRole.industries}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
