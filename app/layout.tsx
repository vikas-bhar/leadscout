import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FreelanceFind",
  description:
    "Find local businesses with digital gaps, score the opportunity, and generate personalized outreach pitches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-gray-50 text-foreground`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
