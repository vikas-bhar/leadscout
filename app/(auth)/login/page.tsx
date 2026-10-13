import { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to LeadScout to access your AI lead intelligence dashboard, prospect audits, and saved lead lists.",
  alternates: {
    canonical: "https://leadscout-ashy.vercel.app/login",
  },
  openGraph: {
    title: "Sign In | LeadScout",
    description: "Sign in to LeadScout to access your AI lead intelligence dashboard, prospect audits, and saved lead lists.",
    url: "https://leadscout-ashy.vercel.app/login",
    siteName: "LeadScout",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | LeadScout",
    description: "Sign in to LeadScout to access your AI lead intelligence dashboard, prospect audits, and saved lead lists.",
    images: ["/og-image.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading LeadScout...</span>
          </div>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
