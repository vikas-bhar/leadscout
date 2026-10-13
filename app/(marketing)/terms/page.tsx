import { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft, AlertCircle, Scale, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing the use of LeadScout lead generation software, subscriptions, credit rollover, and AI pitch drafting tools.",
  alternates: {
    canonical: "https://leadscout-ashy.vercel.app/terms",
  },
  openGraph: {
    title: "Terms of Service | LeadScout",
    description: "Terms and conditions governing the use of LeadScout lead generation software, subscriptions, credit rollover, and AI pitch drafting tools.",
    url: "https://leadscout-ashy.vercel.app/terms",
    siteName: "LeadScout",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | LeadScout",
    description: "Terms and conditions governing the use of LeadScout lead generation software, subscriptions, credit rollover, and AI pitch drafting tools.",
    images: ["/og-image.png"],
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            Terms of Use & Legal Agreement
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-xs text-neutral-400">Last updated: October 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert space-y-8 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">1. Agreement to Terms</h2>
            <p>
              By accessing, browsing, or utilizing LeadScout (&quot;the Service&quot;), you enter into a legally binding agreement with LeadScout and agree to adhere to these Terms of Service. If you do not accept these terms, you must immediately discontinue use of the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">2. Plan Tiers, Credits & Billing Rules</h2>
            <p>
              LeadScout operates on a credit-based prospecting and audit model:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Free Starter Tier:</strong> Includes 20 free discovery credits upon signup to explore the platform and run initial test scans without a credit card.</li>
              <li><strong>Top-Up Credit Packs:</strong> One-time credit top-up packages (Starter 100 credits, Pro 600 credits, Agency 2,000 credits) never expire and remain in your wallet until consumed.</li>
              <li><strong>Monthly Subscriptions:</strong> Includes <strong>Freelancer</strong> ($19/mo, 300 credits/mo), <strong>Growth</strong> ($49/mo, 1,000 credits/mo with rollover of unused subscription credits up to a 500-credit cap), and <strong>Agency</strong> ($99/mo, 2,500 credits/mo with rollover up to a 1,500-credit cap). Monthly subscription credits refill on each billing cycle.</li>
              <li><strong>Cancellations:</strong> You can cancel recurring subscriptions at any time via the Settings billing manager. You retain full access through the end of your prepaid billing period.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              3. Agency Plan Provisions
            </h2>
            <p>
              Subscribers to the <strong>Agency Plan</strong> are entitled to high-volume commercial scouting features:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Credit Allocation & Rollover:</strong> 2,500 fresh credits allocated every monthly billing cycle. Unused subscription credits roll over each month up to a maximum cumulative cap of 1,500 rollover credits while the subscription remains active.</li>
              <li><strong>Multi-Seat Team Access:</strong> Up to 5 team member seats under a single consolidated billing master account. The primary account holder remains responsible for team adherence to these Terms.</li>
              <li><strong>Priority Infrastructure:</strong> Agency queries receive prioritized execution in our Apify proxy queue and access to custom AI tone and prompt template controls.</li>
              <li><strong>Export Limits:</strong> Agency subscribers receive unlimited CSV export capabilities for internal client prospecting. Reselling or distributing raw database dumps is strictly prohibited.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              4. Disclaimer on Scraped Business Data & Inaccuracies
            </h2>
            <p>
              LeadScout aggregates publicly accessible listings and social endpoints from Google Maps and public Instagram profiles:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>No Guarantee of Accuracy:</strong> Scraped business data originates from third-party sources and may be incomplete, outdated, or inaccurate. Contact information, website statuses, phone numbers, operating hours, and engagement metrics can change without notice. We make no warranty or representation regarding the accuracy, completeness, or freshness of third-party public listings.</li>
              <li><strong>User Responsibility for Outreach:</strong> LeadScout provides AI-assisted pitch suggestions and digital gap audits as productivity tools. You are solely responsible for independently verifying lead information and ensuring all communications comply with local telecommunications, marketing, and privacy laws (including CAN-SPAM, GDPR, UK PECR, and CASL).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">5. Acceptable Use Policy</h2>
            <p>
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Send unsolicited mass spam, abusive, or harassing messages in violation of regional anti-spam regulations.</li>
              <li>Reverse engineer, decompile, or attempt to extract source code or underlying scraping infrastructure.</li>
              <li>Scrape or abuse the LeadScout application itself through automated bots, scrapers, or excessive programmatic querying.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall LeadScout, its founders, directors, employees, affiliates, or licensors be liable for any indirect, incidental, special, exemplary, consequential, or punitive damages, including loss of profits, revenues, contracts, goodwill, or business opportunities, arising out of or related to your use of or inability to use the Service or any inaccuracies in scraped data.
            </p>
            <p>
              In all circumstances, LeadScout&apos;s aggregate liability for all claims arising under or in connection with these Terms shall not exceed the greater of one hundred US dollars ($100 USD) or the total fees paid by you to LeadScout in the twelve (12) months preceding the event giving rise to liability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              7. Governing Law & Jurisdiction
            </h2>
            {/* TODO: Fill in your governing jurisdiction, e.g. State of Delaware, United States / England and Wales / DIFC Dubai */}
            <p className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 rounded-lg text-amber-900 dark:text-amber-200 text-[11px] font-mono">
              <strong>[TODO: INSERT JURISDICTION / GOVERNING LAW, e.g., State of Delaware, United States / England and Wales / DIFC Dubai]</strong>
            </p>
            <p>
              These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of <strong>[TODO: INSERT JURISDICTION, e.g. the State of Delaware, United States]</strong>, without giving effect to any principles of conflicts of law.
            </p>
            <p>
              Any legal action or proceeding arising under these Terms shall be brought exclusively in the courts located in <strong>[TODO: INSERT VENUE, e.g. New Castle County, Delaware]</strong>, and the parties consent to the personal jurisdiction and venue of such courts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">8. Refund Policy</h2>
            <p>
              We provide 20 free test credits so you can thoroughly evaluate the tool prior to subscribing. In the event of confirmed service outages or technical delivery failures on credit packs, refund requests submitted within 7 days of purchase to our support team will be promptly reviewed and credited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">9. Contact Information</h2>
            <p>
              Questions regarding these Terms of Service may be addressed to our legal desk at:{" "}
              <a href="mailto:support@leadscout.app" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                support@leadscout.app
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
