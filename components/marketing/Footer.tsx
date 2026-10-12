'use client'

import Link from 'next/link'
import { AppLogo } from '@/components/ui/AppLogo'

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1 */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <AppLogo href="/" size="md" theme="dark" />
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              AI client finder for freelancers. Scan Google Maps, analyze digital gaps, and close more deals.
            </p>
            <p className="text-xs text-gray-400 font-medium">
              Built for freelancers worldwide 🌍
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="/#features" className="hover:text-white transition-colors">Gap Analyzer</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/signup" className="hover:text-white transition-colors">Sign up free</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Credits</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy#cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><a href="mailto:support@leadscout.app" className="hover:text-white transition-colors">Support & Contact</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>
            © 2026 LeadScout. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>English (US)</span>
            <span>•</span>
            <span>Secure 256-bit SSL</span>
          </div>
        </div>

      </div>
    </footer>
  )
}
