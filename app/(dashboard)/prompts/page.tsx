import { Metadata } from "next";
import { PromptsClient } from "./PromptsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Custom AI Prompts & Filters — LeadScout",
  description: "Define how AI analyzes businesses, spots high-converting digital gaps, and writes your custom outreach pitches.",
  robots: { index: false },
};

export default function PromptsPage() {
  return <PromptsClient />;
}
