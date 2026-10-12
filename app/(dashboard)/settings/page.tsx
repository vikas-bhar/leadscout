import { Metadata } from "next";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings & Pitch Templates",
  description: "Manage your library of customizable outreach email and DM templates that auto-insert AI-generated pitches.",
  alternates: {
    canonical: "https://leadscout-ashy.vercel.app/settings",
  },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
