import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_TOKEN =
  process.env.APIFY_API_TOKEN ||
  process.env.APIFY_TOKEN ||
  "apify_api_8LqgqPi05asVvF0Ng2QUAm2csk5ZER4B7a7i";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const datasetId = searchParams.get("datasetId") || "b1wOSq2O5NFTnJfpi";
  const token = searchParams.get("token") || DEFAULT_TOKEN;
  const limit = searchParams.get("limit") || "100";
  const offset = searchParams.get("offset") || "0";
  const clean = searchParams.get("clean") || "true";
  const desc = searchParams.get("desc") || "false";

  const startTime = Date.now();
  try {
    const apifyUrl = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(token)}&limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}&clean=${encodeURIComponent(clean)}&desc=${encodeURIComponent(desc)}`;
    
    const res = await fetch(apifyUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const items = await res.json().catch(() => []);

    const itemCountHeader = res.headers.get("x-apify-pagination-total") || (Array.isArray(items) ? items.length : 0);

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      totalCount: Number(itemCountHeader),
      itemCount: Array.isArray(items) ? items.length : 0,
      data: items,
      endpoint: `https://api.apify.com/v2/datasets/${datasetId}/items`,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dataset items";
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
