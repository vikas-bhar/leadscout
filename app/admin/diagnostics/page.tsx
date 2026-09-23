import { Metadata } from "next";
import { DiagnosticLogsView } from "@/components/admin/DiagnosticLogsView";
import { Navbar } from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Scraper Diagnostics | FreelanceFind Admin",
  description: "Internal diagnostic logging, raw HTML response inspector, and extraction error analysis.",
};

export default function AdminDiagnosticsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <DiagnosticLogsView />
      </main>
    </div>
  );
}
