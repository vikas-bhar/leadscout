'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-xl">
        
        <div className="w-16 h-16 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Credits added! 🎉
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          Your payment was successful and your new search credits have been added to your wallet.
        </p>

        <Link
          href="/search"
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition-all"
        >
          <span>Start searching</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

      </div>
    </main>
  )
}
