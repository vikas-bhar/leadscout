import { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | LeadScout",
  description: "LeadScout Privacy Policy, data governance, and user privacy protections.",
};

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            Data Protection & Security
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-neutral-400">Last updated: September 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert space-y-6 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">1. Information We Collect</h2>
            <p>
              LeadScout collects information to deliver tailored freelance lead intelligence and prospect auditing. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information: Full name, email address, password hashes, and freelancer role preference.</li>
              <li>Publicly accessible business data: Public listings, reviews, ratings, and social metrics obtained from Google Maps and Instagram profile endpoints.</li>
              <li>Usage data: Prospecting search history, saved filters, custom prompts, and credit balances.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">2. How We Use Your Data</h2>
            <p>
              Your data is strictly used to evaluate digital gaps, generate personalized client outreach pitches, manage account credit wallets, and maintain secure billing integrations with Stripe. We do not sell your personal information or client records to any third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">3. Security & Payment Processing</h2>
            <p>
              All payment transactions are encrypted and processed through Stripe using industry-standard PCI-DSS Level 1 compliance. We do not store raw credit card numbers on LeadScout servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">4. Data Retention & Erasure</h2>
            <p>
              You maintain complete ownership of your leads and search logs. You can delete your leads, reset your prospecting search history, or request account erasure anytime via the <strong>Settings</strong> page or by contacting our support team.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">5. Contact Information</h2>
            <p>
              If you have any questions regarding this Privacy Policy or your personal data, contact us at:{" "}
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
