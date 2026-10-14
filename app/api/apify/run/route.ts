import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_TOKEN =
  process.env.APIFY_API_TOKEN ||
  process.env.APIFY_TOKEN ||
  "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId") || "nIH0dNyLGe66edgys";
  const token = searchParams.get("token") || DEFAULT_TOKEN;

  const startTime = Date.now();
  try {
    const apifyUrl = `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}?token=${encodeURIComponent(token)}`;
    const res = await fetch(apifyUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json().catch(() => null);

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      data: data?.data || data,
      endpoint: `https://api.apify.com/v2/actor-runs/${runId}`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch actor run";
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const runId = body.runId || "nIH0dNyLGe66edgys";
    const action = body.action || "abort"; // 'abort' | 'resurrect'
    const token = body.token || DEFAULT_TOKEN;

    if (!["abort", "resurrect"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'abort' or 'resurrect'." },
        { status: 400 }
      );
    }

    const apifyUrl = `https://api.apify.com/v2/actor-runs/${encodeURIComponent(runId)}/${action}?token=${encodeURIComponent(token)}`;
    const res = await fetch(apifyUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json().catch(() => null);

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      data: data?.data || data,
      endpoint: `https://api.apify.com/v2/actor-runs/${runId}/${action}`,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to execute action on actor run";
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
