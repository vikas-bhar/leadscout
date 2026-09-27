'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles, MapPin, Star } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 border border-blue-200 dark:border-blue-800 shadow-sm animate-fadeInUp">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>AI-powered client discovery</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1]">
              Find freelance clients <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                who need you right now
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl leading-relaxed">
              LeadScout scans Google Maps and Instagram, finds businesses with digital gaps, and writes your personalized pitch — in 60 seconds.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-8">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:translate-y-[-1px]"
              >
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                See how it works
              </Link>
            </div>

            {/* Social Proof Bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>20 free credits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>No card needed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span>Results in 60s</span>
              </div>
            </div>

          </div>

          {/* Right Column: Animated Mockup */}
          <div className="lg:col-span-5 w-full">
            <div className="relative mx-auto max-w-md lg:max-w-none bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-5 overflow-hidden">
              
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="text-xs font-mono text-gray-400">LeadScout Live Search</div>
              </div>

              {/* Search Form Mock */}
              <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl mb-4 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                  <span>Target: Web Designer</span>
                  <span className="text-blue-600 dark:text-blue-400">Dubai, UAE</span>
                </div>
                <div className="h-2 w-full bg-blue-100 dark:bg-blue-950 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4" />
                </div>
              </div>

              {/* Live Lead Cards Mockup */}
              <div className="space-y-3">
                
                {/* Lead Card 1 */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 shadow-sm hover:border-blue-500 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Spice Garden Restaurant</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-500" /> Al Barsha, Dubai • <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 3.2
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-bold text-xs flex items-center justify-center border border-red-200 dark:border-red-900">
                        94
                      </div>
                      <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 mt-1 uppercase">Critical Gap</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">❌ No Website • ❌ No Instagram</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">View pitch →</span>
                  </div>
                </div>

                {/* Lead Card 2 */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 shadow-sm opacity-90">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Glow Beauty Salon</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-red-500" /> Bandra, Mumbai • <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> 4.1
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 font-bold text-xs flex items-center justify-center border border-yellow-200 dark:border-yellow-900">
                        87
                      </div>
                      <span className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 mt-1 uppercase">High Gap</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
