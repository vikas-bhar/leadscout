/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCreditPackage, packageCreditsAwarded } from "@/lib/credits";
import type { CreditPackage } from "@/types";

export const dynamic = "force-dynamic";

const stripeDiagnosticSchema = z.object({
  eventId: z.string().optional(),
  eventType: z.string().optional(),
  objectType: z.string().optional(),
  metadata: z.object({
    user_id: z.string().optional(),
    userId: z.string().optional(),
    package_id: z.string().optional(),
    packageId: z.string().optional(),
    credits: z.string().optional(),
  }).passthrough().optional(),
  amount_total: z.number().optional(),
  currency: z.string().optional(),
  payment_status: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const parsed = stripeDiagnosticSchema.safeParse(rawBody);

    const timestamp = new Date().toISOString();
    const validationSteps: Array<{ step: string; status: "ok" | "warning" | "failed"; detail: string }> = [];

    let isValid = true;
    let extractedUserId: string | null = null;
    let extractedPackageId: string | null = null;
    let expectedCredits = 0;

    if (!parsed.success) {
      validationSteps.push({
        step: "Payload Schema Parse",
        status: "failed",
        detail: `Zod parse error: ${JSON.stringify(parsed.error.flatten())}`,
      });
      isValid = false;
    } else {
      validationSteps.push({
        step: "Payload Schema Parse",
        status: "ok",
        detail: "Successfully parsed Stripe event/metadata payload structure.",
      });

      const data = parsed.data;
      const metadata = data.metadata || {};

      extractedUserId = metadata.user_id || metadata.userId || null;
      if (extractedUserId) {
        validationSteps.push({
          step: "User ID Verification",
          status: "ok",
          detail: `Found valid user reference ID: ${extractedUserId}`,
        });
      } else {
        validationSteps.push({
          step: "User ID Verification",
          status: "failed",
          detail: "Missing user identifier in metadata (user_id or userId required).",
        });
        isValid = false;
      }

      extractedPackageId = metadata.package_id || metadata.packageId || null;
      if (extractedPackageId) {
        validationSteps.push({
          step: "Package ID Verification",
          status: "ok",
          detail: `Found package ID: ${extractedPackageId}`,
        });

        const pack = getCreditPackage(extractedPackageId as CreditPackage["id"]);
        if (pack) {
          expectedCredits = packageCreditsAwarded(pack);
          validationSteps.push({
            step: "Credit Package Lookup",
            status: "ok",
            detail: `Resolved package '${pack.name}', awarding ${expectedCredits} credits.`,
          });
        } else if (extractedPackageId === "flexible") {
          validationSteps.push({
            step: "Credit Package Lookup",
            status: "ok",
            detail: "Resolved flexible custom pay-as-you-go package ($0.10/credit).",
          });
        } else {
          validationSteps.push({
            step: "Credit Package Lookup",
            status: "warning",
            detail: `Package ID '${extractedPackageId}' not found in standard static packages list (may be custom or dynamic).`,
          });
        }
      } else {
        validationSteps.push({
          step: "Package ID Verification",
          status: "warning",
          detail: "No package ID provided in metadata.",
        });
      }

      if (metadata.credits) {
        const metaCredits = parseInt(metadata.credits, 10);
        validationSteps.push({
          step: "Metadata Credits Check",
          status: "ok",
          detail: `Metadata specifies ${metaCredits} credits.`,
        });
      } else {
        validationSteps.push({
          step: "Metadata Credits Check",
          status: "warning",
          detail: "Metadata does not explicitly specify credits count.",
        });
      }
    }

    const diagnosticResult = {
      timestamp,
      verified: isValid,
      extractedUserId,
      extractedPackageId,
      expectedCredits,
      validationSteps,
      rawPayloadSummary: rawBody,
    };

    console.log("[STRIPE DIAGNOSTIC REPORT]", JSON.stringify(diagnosticResult, null, 2));

    return NextResponse.json({
      success: true,
      diagnostic: diagnosticResult,
    });
  } catch (err: any) {
    console.error("POST /api/diagnostics/stripe error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Diagnostic check failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "Stripe Webhook & Payment Intent Diagnostic Tool",
    usage: "Send a POST request with Stripe session/webhook payload or metadata to verify parameters.",
    status: "active",
  });
}
