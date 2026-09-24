import { Metadata } from "next";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = {
  title: "Outreach Email & DM Templates - Settings | FreelanceFind",
  description: "Manage your library of customizable outreach email and DM templates that auto-insert AI-generated pitches.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
