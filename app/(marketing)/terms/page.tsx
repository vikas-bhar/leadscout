import { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | LeadScout",
  description: "Terms and conditions governing the use of LeadScout lead generation software and subscription credits.",
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
            Terms of Use
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-xs text-neutral-400">Last updated: September 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or utilizing LeadScout (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our prospecting and AI pitch generation tools.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">2. Credits, Subscriptions & Billing</h2>
            <p>
              LeadScout operates on a credit-based prospecting system:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>One-time credit purchases never expire and remain in your account until consumed.</li>
              <li>Monthly subscriptions (Freelancer, Growth, Agency) refill your monthly credit quota at each billing cycle.</li>
              <li>Subscriptions can be cancelled at any time through the in-app billing manager or Stripe Customer Portal. You retain full access to your plan benefits until the end of your prepaid billing period.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">3. Acceptable Use Policy</h2>
            <p>
              Users agree to conduct outreach in compliance with regional regulations (such as CAN-SPAM, GDPR, and CASL). LeadScout provides cold outreach pitch drafts for informational and productivity purposes; users are responsible for final message sending and respecting recipient communication preferences.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">4. Refund Policy</h2>
            <p>
              In the event that a prospecting search encounters technical failure or does not return valid data, credits used for that operation are automatically refunded to your balance. For subscription or billing disputes, please reach out to our concierge support team.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">5. Contact Information</h2>
            <p>
              For legal inquiries, billing questions, or support assistance, contact us at:{" "}
              <a href="mailto:officalleadscout@gmail.com" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                officalleadscout@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
