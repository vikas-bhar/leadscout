import { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft, AlertCircle, Scale, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing the use of LeadScout lead generation software, subscriptions, and AI pitch drafting tools.",
  alternates: {
    canonical: "https://leadscout-ashy.vercel.app/terms",
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
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">2. Plan Tiers, Credits & Billing</h2>
            <p>
              LeadScout operates on a credit-based prospecting system:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Free Starter Tier:</strong> Includes 20 free discovery credits upon signup to explore the platform and run initial test scans without a credit card.</li>
              <li><strong>Pay-As-You-Go Credit Packs:</strong> One-time credit top-up packages (Starter 100 credits, Pro 600 credits, Agency 2,000 credits) never expire and remain in your wallet until consumed.</li>
              <li><strong>Monthly Subscriptions:</strong> Includes <strong>Freelancer</strong> ($19/mo, 300 credits), <strong>Growth</strong> ($49/mo, 1,000 credits with rollover up to 500 unused credits), and <strong>Agency</strong> ($99/mo, 2,500 credits with multi-seat access and rollover up to 1,500 credits). Subscriptions automatically replenish on each monthly billing date.</li>
              <li><strong>Cancellations:</strong> You can cancel recurring subscriptions at any time via the Settings billing portal. You will retain full access through the remainder of your paid billing term.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              3. Public Directory Data & Platform Compliance Disclaimer
            </h2>
            <p>
              LeadScout aggregates publicly accessible business listings and public social presence endpoints to identify digital opportunities. You understand and acknowledge:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Public directory listings, phone numbers, ratings, and social links originate from third-party services. While we strive for high freshness, LeadScout makes no warranty that all public listings or audit metrics are 100% error-free, uninterrupted, or current.</li>
              <li>LeadScout provides AI-assisted pitch suggestions and gap detection as productivity aids. Users retain exclusive discretion over whether and how they contact prospective businesses.</li>
              <li>Users are solely responsible for ensuring that their direct communications and cold outreach campaigns comply with applicable local telecommunications, consumer protection, and marketing regulations (including CAN-SPAM, GDPR, UK PECR, UAE telecommunications laws, and CASL).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">4. Acceptable Use Policy</h2>
            <p>
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harass, abuse, or send unsolicited mass spam in violation of regional anti-spam statutes.</li>
              <li>Reverse engineer, decompile, or attempt to extract the underlying source code of our API services or scraping algorithms.</li>
              <li>Resell raw database access or redistribute unauthenticated bulk exports without an enterprise partnership agreement.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              5. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall LeadScout, its owners, directors, affiliates, or licensors be liable for any indirect, incidental, special, exemplary, consequential, or punitive damages, including loss of profits, revenues, business opportunities, goodwill, or data, arising from or related to your use of or inability to use the Service. In all circumstances, LeadScout&apos;s total aggregate liability under these terms shall be limited to the greater of $100 or the total fees paid by you to LeadScout in the preceding twelve (12) months.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              6. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms and any dispute or claim arising out of or related to them shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without giving effect to any principles of conflicts of law. For international users operating in the UK, European Union, or UAE, nothing in these terms shall deprive you of mandatory consumer protections provided by your home jurisdiction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">7. Refund Policy</h2>
            <p>
              We provide 20 free test credits so you can thoroughly evaluate the tool prior to subscribing. In the event of confirmed service outages or technical delivery failures on credit packs, refund requests submitted within 7 days of purchase to our support team will be promptly reviewed and credited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">8. Contact Information</h2>
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
