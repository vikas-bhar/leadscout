import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_TOKEN =
  process.env.APIFY_API_TOKEN ||
  process.env.APIFY_TOKEN ||
  "apify_api_8LqgqPi05asVvF0Ng2QUAm2csk5ZER4B7a7i";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId") || "nIH0dNyLGe66edgys";
  const token = searchParams.get("token") || DEFAULT_TOKEN;

  const startTime = Date.now();
  try {
    const apifyUrl = `https://api.apify.com/v2/logs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`;
    const res = await fetch(apifyUrl, {
      method: "GET",
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const logText = await res.text();

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      log: logText,
      lineCount: logText.split("\n").length,
      endpoint: `https://api.apify.com/v2/logs/${runId}`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch run log";
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
