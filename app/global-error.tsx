"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global app error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-neutral-900 mb-2">Unexpected Application Error</h1>
            <p className="text-sm text-neutral-500 mb-6">
              An unexpected error occurred in the application. Please reload the page to continue.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
