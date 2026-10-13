import { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowLeft, Cookie, Server, Scale, Database, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LeadScout Privacy Policy, GDPR rights, third-party subprocessor disclosure, cookie practices, and commercial data use.",
  alternates: {
    canonical: "https://leadscout-ashy.vercel.app/privacy",
  },
  openGraph: {
    title: "Privacy Policy | LeadScout",
    description: "LeadScout Privacy Policy, GDPR rights, third-party subprocessor disclosure, cookie practices, and commercial data use.",
    url: "https://leadscout-ashy.vercel.app/privacy",
    siteName: "LeadScout",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | LeadScout",
    description: "LeadScout Privacy Policy, GDPR rights, third-party subprocessor disclosure, cookie practices, and commercial data use.",
    images: ["/og-image.png"],
  },
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
            Data Protection, GDPR & Cookie Policy
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-neutral-400">Last updated: October 2026</p>
        </div>

        <div className="prose prose-sm dark:prose-invert space-y-8 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">1. Information We Collect</h2>
            <p>
              LeadScout collects information to deliver tailored freelance lead intelligence and prospect auditing. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Full name, email address, password hashes, and freelancer role preference.</li>
              <li><strong>Public Commercial Business Data:</strong> Public commercial business listings, ratings, review totals, photo counts, and publicly displayed social media endpoints obtained from public Google Maps directories and Instagram public profiles.</li>
              <li><strong>Usage & Search Data:</strong> Prospecting search queries, saved lead folders, custom outreach prompts, and credit ledger balances.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              2. How Public Business Directory Data Is Used
            </h2>
            <p>
              LeadScout aggregates publicly accessible commercial business listings from Google Maps and public Instagram profiles solely for the purpose of assisting freelancers in auditing digital marketing gaps and drafting personalized business-to-business (B2B) outreach pitches.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Commercial Gap Analysis:</strong> We evaluate whether a public business listing has an official dedicated website, mobile booking capabilities, recent social media activity, or unaddressed customer reviews.</li>
              <li><strong>No Consumer Profiling:</strong> We do not collect, process, or sell personal consumer records, individual private messages, or non-business private phone numbers.</li>
              <li><strong>No Third-Party Resale:</strong> Scraped public commercial data is processed solely for your individual account queries and is never sold to third-party data brokers or marketing list aggregators.</li>
              <li><strong>Opt-Out for Businesses:</strong> Any local business wishing to have their public listing excluded from our gap analyzer index may submit a request to our data desk at <a href="mailto:support@leadscout.app" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">support@leadscout.app</a>.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              3. Legal Basis for Processing (GDPR & International Frameworks)
            </h2>
            <p>
              We process data under the following legal bases:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contract Performance (GDPR Art. 6(1)(b)):</strong> To operate your LeadScout account, deliver search results, track credit consumption, and process payments.</li>
              <li><strong>Legitimate Interests (GDPR Art. 6(1)(f)):</strong> Processing publicly published B2B contact and commercial directory listings for legitimate business prospecting and gap intelligence. Businesses published on commercial maps directories voluntarily share this data to connect with service providers and consumers.</li>
              <li><strong>Legal Obligation (GDPR Art. 6(1)(c)):</strong> Maintaining billing records, tax compliance, and fraud prevention.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              4. Third-Party Subprocessors
            </h2>
            <p>
              We share data only with trusted infrastructure subprocessors necessary to deliver the Service under strict confidentiality agreements:
            </p>
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                    <th className="p-2.5 font-semibold">Subprocessor</th>
                    <th className="p-2.5 font-semibold">Purpose</th>
                    <th className="p-2.5 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <tr>
                    <td className="p-2.5 font-medium">Supabase Inc.</td>
                    <td className="p-2.5">User authentication, session tokens, and encrypted database storage</td>
                    <td className="p-2.5">United States / Global AWS</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Stripe Inc.</td>
                    <td className="p-2.5">Payment gateway processing, subscription recurring billing, and fraud detection (PCI-DSS Level 1)</td>
                    <td className="p-2.5">United States / Global</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Apify Technologies s.r.o.</td>
                    <td className="p-2.5">Execution of public web extractors and Google Maps directory runners</td>
                    <td className="p-2.5">Czech Republic / EU</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Google LLC (Gemini API)</td>
                    <td className="p-2.5">AI digital gap synthesis and personalized outreach pitch generation (server-side only)</td>
                    <td className="p-2.5">United States / Global GCP</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Resend Inc.</td>
                    <td className="p-2.5">Transactional email delivery, account notifications, and password reset flows</td>
                    <td className="p-2.5">United States</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Vercel Inc.</td>
                    <td className="p-2.5">Application hosting, edge network routing, serverless compute, and SSL/TLS delivery</td>
                    <td className="p-2.5">United States / Global CDN</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="cookies" className="space-y-2 scroll-mt-20">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Cookie className="w-4 h-4 text-blue-600" />
              5. Cookie Policy
            </h2>
            <p>
              LeadScout utilizes minimal first-party cookies necessary for core platform security, session management, and performance:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Strictly Necessary Cookies:</strong> <code className="text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">ff_auth_session</code>, <code className="text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">ff_auth_user</code>, and Supabase auth session tokens are required to securely authenticate your account session and protect against CSRF attacks.</li>
              <li><strong>Functional Cookies:</strong> Store your theme preference (dark/light) and search view layout settings.</li>
              <li><strong>Zero Advertising Cookies:</strong> We do not deploy third-party advertising cookies, cross-site tracking pixels, or marketing trackers.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              6. Your Rights Under GDPR (Access, Deletion, Export)
            </h2>
            <p>
              Under the General Data Protection Regulation (GDPR), UK GDPR, and applicable international privacy laws, all users have the following enforceable rights:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right to Access:</strong> You can request a full copy of all personal information, search queries, and credit transaction records associated with your account.</li>
              <li><strong>Right to Deletion (&quot;Right to be Forgotten&quot;):</strong> You can permanently delete individual saved leads, clear your search history, or request full account deletion via your Account Settings or by emailing support. Upon confirmation, all associated data is permanently erased from active databases.</li>
              <li><strong>Right to Export (Data Portability):</strong> You can export your saved leads, audit scores, and generated pitch records in standard CSV or JSON format at any time directly through the dashboard.</li>
              <li><strong>Right to Rectification:</strong> You can modify and correct your personal details, brand identity, or agency settings at any time.</li>
              <li><strong>Right to Restrict or Object to Processing:</strong> You have the right to object to processing of personal data conducted under the basis of legitimate interests.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">7. Data Retention & Security</h2>
            <p>
              We implement industry-standard encryption in transit (TLS 1.3) and at rest (AES-256). Credit balances and search history remain associated with your account until you delete them or close your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">8. Contact Information & Data Protection Desk</h2>
            <p>
              For privacy inquiries, subprocessor agreements, or data subject deletion requests, email our data protection desk directly at:{" "}
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
