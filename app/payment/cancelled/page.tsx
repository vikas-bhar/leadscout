'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PaymentCancelledPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center shadow-xl">
        
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
          ⚠️
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Checkout cancelled
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
          No worries — your card was not charged. You can buy credits anytime from your dashboard.
        </p>

        <Link
          href="/search"
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go back to dashboard</span>
        </Link>

      </div>
    </main>
  )
}
