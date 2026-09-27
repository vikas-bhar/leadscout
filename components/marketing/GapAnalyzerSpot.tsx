'use client'

import Link from 'next/link'
import { Sparkles, Check, ArrowRight, Camera } from 'lucide-react'

export function GapAnalyzerSpot() {
  const features = [
    "Instagram profile deep audit",
    "Website gap analysis",
    "Google Maps listing check",
    "Opportunity score (0-100)",
    "2 personalized pitches",
  ]

  return (
    <section className="py-20 lg:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>NEW FEATURE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Analyze any Instagram or website instantly
            </h2>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Found a potential client on your own? Paste their Instagram link or website URL. Our AI analyzes their full digital presence and writes you a personalized pitch in 30 seconds.
            </p>

            <ul className="space-y-3 mb-8">
              {features.map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all"
              >
                <span>Try Gap Analyzer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-xs text-gray-500 font-medium">
                Costs 5 credits per analysis
              </span>
            </div>
          </div>

          {/* Right Visual Mockup */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xl">
              
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-pink-600" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">AI Gap Analyzer</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">Ready</span>
              </div>

              {/* URL Input Mock */}
              <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 flex items-center justify-between text-xs font-mono text-gray-600 dark:text-gray-300">
                <span>instagram.com/example_cafe</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">Audit →</span>
              </div>

              {/* Audit Results Preview */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">Audit Score</span>
                  <span className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">78 / 100</span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[78%]" />
                </div>
              </div>

              {/* Gaps Found */}
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-center justify-between font-medium">
                  <span>❌ No website linked in bio</span>
                  <span>High Impact</span>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/50 text-xs text-yellow-700 dark:text-yellow-300 flex items-center justify-between font-medium">
                  <span>⚠️ Last post 42 days ago</span>
                  <span>Medium Impact</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
