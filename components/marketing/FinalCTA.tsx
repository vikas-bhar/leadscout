'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap, Coins, Compass } from 'lucide-react'
import { useAuthUser } from '@/lib/hooks/useAuthUser'

export function FinalCTA() {
  const { isSignedIn } = useAuthUser()
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
          Start finding clients today
        </h2>

        <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-medium">
          20 free credits. No card needed. First lead in 60 seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {isSignedIn ? (
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-bold rounded-xl shadow-xl transition-all"
            >
              <Compass className="w-5 h-5" />
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-bold rounded-xl shadow-xl transition-all"
            >
              <span>Create free account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/pricing"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-700/50 hover:bg-blue-700 text-white font-bold rounded-xl border border-blue-400/30 transition-all"
          >
            See pricing
          </Link>
        </div>

        {/* Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs sm:text-sm text-blue-100 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-300" />
            <span>No card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-300" />
            <span>Results in 60s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-blue-300" />
            <span>Credits never expire</span>
          </div>
        </div>

      </div>
    </section>
  )
}
