'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Star, ArrowRight, Eye, Copy, Check, X, Sparkles, Mail, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export function Demo() {
  const leads = [
    {
      name: "Spice Garden Restaurant",
      location: "Dubai, UAE",
      score: 94,
      badge: "CRITICAL",
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200",
      tags: ["No dedicated website", "Zero Instagram posts"],
      rating: "3.2",
      reviews: 142,
      pitchSummary: "Hey, I was looking for restaurants in Al Barsha and noticed Spice Garden doesn't have a direct mobile reservation website yet...",
      fullEmail: `Subject: Missing mobile table bookings for Spice Garden (Al Barsha)

Hi Spice Garden Management,

I recently explored high-rated dining spots around Al Barsha and noticed Spice Garden has over 140 Google reviews, but no official mobile website for direct reservations or digital menu ordering.

Right now, prospective diners on smartphones are bounced to generic third-party aggregator directories that charge 15-20% commission or show competing restaurants.

I put together a quick preview of an instant 1-tap mobile reservation flow with WhatsApp table booking tailored for Spice Garden.

Would you be open to a 2-minute visual preview this week?

Best regards,
[Your Name] | Freelance Web Designer`,
      dmScript: `Hey team Spice Garden! 👋 Loved reading your recent 140+ reviews in Al Barsha. Noticed your Google Maps profile currently doesn't link to a mobile reservation page. Put together a free mockup of a direct 1-tap booking menu so you don't lose smartphone diners to nearby competitors. Mind if I send the 30-sec video walkthrough over?`,
      gaps: [
        "Google Maps lists no dedicated website domain (only third-party directory listings).",
        "No digital menu or direct table reservation portal.",
        "Over 140 reviews with unaddressed 3.2★ customer feedback.",
      ]
    },
    {
      name: "Glow Beauty Salon",
      location: "Mumbai, India",
      score: 87,
      badge: "HIGH",
      badgeColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200",
      tags: ["Dead Instagram", "Last posted 4 months ago"],
      rating: "4.1",
      reviews: 128,
      pitchSummary: "Your salon has 128 reviews but hasn't posted on Instagram in 4 months. Competitors with daily Reels are capturing local clients...",
      fullEmail: `Subject: Quick idea for Glow Beauty Salon's Instagram (Bandra West)

Hi Glow Beauty Salon Team,

I came across your salon listing in Mumbai and was impressed by your 128 positive reviews and 4.1-star rating.

However, I noticed your Instagram profile hasn't posted any client transformations or Reels in over 4 months. In local beauty care, active Instagram feeds drive 60%+ of walk-ins from local clients searching for seasonal treatments.

I audited 3 nearby competitors in Bandra who post 3x/week and are capturing top search rankings. I drafted 5 aesthetic video concept ideas and before/after carousel angles designed specifically for your salon.

Can I send over the 5 concept drafts for your team to check out?

Warmly,
[Your Name] | Freelance Social Media Strategist`,
      dmScript: `Hey Glow Beauty team! ✨ Huge fan of your 120+ client reviews in Mumbai. Noticed your feed has been quiet for 4 months—competitors nearby are gaining huge traction with trending local Reels. I drafted 5 easy salon content concepts you can post this week. Would you like me to drop them here?`,
      gaps: [
        "Instagram page inactive for over 120 days.",
        "Zero Reels or video transformation content.",
        "Missing automated booking link in Instagram bio.",
      ]
    },
    {
      name: "The Corner Cafe",
      location: "London, UK",
      score: 76,
      badge: "MEDIUM",
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200",
      tags: ["Low engagement", "No Reels format"],
      rating: "4.3",
      reviews: 210,
      pitchSummary: "The Corner Cafe has 2,400 followers but only 0.4% engagement. The London cafe average is 2.1%...",
      fullEmail: `Subject: Boosting weekend brunch footfall for The Corner Cafe

Hi Corner Cafe Team,

I love the aesthetic of your Camden spot and your stellar 210 Google reviews (4.3 stars!).

I took a look at your Instagram page: you have a solid 2,400 followers, but average engagement is currently under 0.5% because posts are static photos rather than short-form coffee and bakery Reels.

Nearby cafes in North London using viral weekend brunch Reels are averaging 2.4% engagement and driving 30+ new weekend visitors weekly.

I created 3 short-form storytelling video scripts highlighting your fresh morning pastries and signature brews.

Would you be open to reviewing the scripts?

Cheers,
[Your Name] | Video Editor & Content Creator`,
      dmScript: `Hey Corner Cafe! ☕ Your brunch photos look incredible! Noticed your 2.4k followers are seeing mostly static stills—short-form barista Reels are getting 5x higher reach across London right now. Put together 3 quick video concepts tailored for your weekend crowd. Want me to send them over?`,
      gaps: [
        "Engagement rate (0.4%) is significantly below London cafe benchmarks (2.1%).",
        "Feed consists strictly of static image posts with no Reels.",
        "No call-to-action in captions for weekend reservations.",
      ]
    },
  ]

  const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null)
  const [pitchTab, setPitchTab] = useState<'email' | 'dm'>('email')
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Pitch copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="demo" className="py-20 lg:py-32 bg-gray-50/50 dark:bg-gray-900/50 scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Live Gap Detection & AI Pitch Bench
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-3">
            See it in action
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Example leads and sample AI pitches. Sign up to run a live scan.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {leads.map((lead, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    Example Prospect
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${lead.badgeColor} uppercase`}>
                      {lead.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                      Score: {lead.score}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                    {lead.name}
                  </h3>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{lead.location}</span>
                    <span>•</span>
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                    <span>{lead.rating} ({lead.reviews} reviews)</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {lead.tags.map((tag, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="bg-gray-50 dark:bg-gray-950 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 mb-6">
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-3">
                    &ldquo;{lead.pitchSummary}&rdquo;
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLead(lead)
                    setPitchTab('email')
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview full pitch</span>
                </button>
                <span className="text-[11px] text-gray-400">Try without account</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all hover:scale-[1.02]"
          >
            Run a live scan in your city (20 Free Credits)
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-500 mt-2">Zero credit card required • Instant results</p>
        </div>

      </div>

      {/* INTERACTIVE TRY-WITHOUT-ACCOUNT PITCH MODAL */}
      {selectedLead && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase">
                    Sample Pitch Preview
                  </span>
                  <span className="text-xs text-gray-400">• {selectedLead.location}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedLead.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detected Gaps */}
            <div className="mb-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Detected Digital Gaps & Leverage Points
              </h4>
              <ul className="space-y-1 text-xs text-amber-900 dark:text-amber-200/90 list-disc pl-4">
                {selectedLead.gaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>

            {/* Script Tabs */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPitchTab('email')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    pitchTab === 'email'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Cold Email Pitch
                </button>
                <button
                  type="button"
                  onClick={() => setPitchTab('dm')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    pitchTab === 'dm'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Instagram DM Script
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(pitchTab === 'email' ? selectedLead.fullEmail : selectedLead.dmScript)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Pitch"}</span>
              </button>
            </div>

            {/* Pitch Text Box */}
            <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6">
              <pre className="text-xs text-gray-800 dark:text-gray-200 font-sans whitespace-pre-wrap leading-relaxed">
                {pitchTab === 'email' ? selectedLead.fullEmail : selectedLead.dmScript}
              </pre>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500">
                Generate custom pitches for any niche with your free credits.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition-all flex-1 sm:flex-initial"
                >
                  <span>Test Live Search</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  )
}
