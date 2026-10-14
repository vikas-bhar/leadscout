import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_TOKEN =
  process.env.APIFY_API_TOKEN ||
  process.env.APIFY_TOKEN ||
  "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kvsId = searchParams.get("kvsId") || "BuQtnXkouKFscVWBd";
  const recordKey = searchParams.get("recordKey") || "INPUT";
  const token = searchParams.get("token") || DEFAULT_TOKEN;

  const startTime = Date.now();
  try {
    const apifyUrl = `https://api.apify.com/v2/key-value-stores/${encodeURIComponent(kvsId)}/records/${encodeURIComponent(recordKey)}?token=${encodeURIComponent(token)}`;
    const res = await fetch(apifyUrl, {
      method: "GET",
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const contentType = res.headers.get("content-type") || "";

    let data: unknown = null;
    let rawText = "";

    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      rawText = await res.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        data = rawText;
      }
    }

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      contentType,
      data,
      endpoint: `https://api.apify.com/v2/key-value-stores/${kvsId}/records/${recordKey}`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch key-value store record";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
