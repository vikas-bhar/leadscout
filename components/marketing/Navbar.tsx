'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Compass } from 'lucide-react'
import { useAuthUser } from '@/lib/hooks/useAuthUser'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isSignedIn } = useAuthUser()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled 
        ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo & Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-gray-900 dark:text-white">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-base shadow-sm">
              🎯
            </span>
            <span>LeadScout</span>
          </Link>
          <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            AI client finder
          </span>
        </div>

        {/* Center: Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            How it works
          </Link>
          <Link href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isSignedIn ? (
            <Link 
              href="/search" 
              className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg shadow-sm transition-all hover:shadow"
            >
              <Compass className="w-4 h-4" />
              <span>Console</span>
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 transition-colors"
              >
                Sign in
              </Link>
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-all hover:shadow"
              >
                Start free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-in Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-xl p-6 flex flex-col gap-4 animate-fadeInUp">
          <Link 
            href="#how-it-works" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-gray-700 dark:text-gray-200 py-2 border-b border-gray-100 dark:border-gray-900"
          >
            How it works
          </Link>
          <Link 
            href="#features" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-gray-700 dark:text-gray-200 py-2 border-b border-gray-100 dark:border-gray-900"
          >
            Features
          </Link>
          <Link 
            href="/pricing" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-gray-700 dark:text-gray-200 py-2 border-b border-gray-100 dark:border-gray-900"
          >
            Pricing
          </Link>
          <Link 
            href="#faq" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-gray-700 dark:text-gray-200 py-2 border-b border-gray-100 dark:border-gray-900"
          >
            FAQ
          </Link>
          <div className="pt-2 flex flex-col gap-3">
            {isSignedIn ? (
              <Link 
                href="/search" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Console</span>
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg"
                >
                  Sign in
                </Link>
                <Link 
                  href="/signup" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
                >
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
