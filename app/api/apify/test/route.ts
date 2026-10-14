import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_TOKEN =
  process.env.APIFY_API_TOKEN ||
  process.env.APIFY_TOKEN ||
  "";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { endpointUrl, method = "GET", token, body, headers: customHeaders } = await request.json();

    if (!endpointUrl) {
      return NextResponse.json({ error: "endpointUrl is required" }, { status: 400 });
    }

    const effectiveToken = token || DEFAULT_TOKEN;

    // Substitute token in URL if provided as placeholder or query param
    let finalUrl = endpointUrl;
    if (finalUrl.includes("token=***") || finalUrl.includes("token=")) {
      finalUrl = finalUrl.replace(/token=([a-zA-Z0-9_\-*]*)/, `token=${encodeURIComponent(effectiveToken)}`);
    } else if (!finalUrl.includes("token=")) {
      const sep = finalUrl.includes("?") ? "&" : "?";
      finalUrl = `${finalUrl}${sep}token=${encodeURIComponent(effectiveToken)}`;
    }

    const reqHeaders: Record<string, string> = {
      Accept: "application/json, text/plain, */*",
      ...customHeaders,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      reqHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(finalUrl, {
      method,
      headers: reqHeaders,
      body: body && ["POST", "PUT", "PATCH"].includes(method) ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const contentType = res.headers.get("content-type") || "";

    // Extract relevant headers to show in test bench
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseData: unknown = null;
    let isJson = false;

    if (contentType.includes("application/json")) {
      responseData = await res.json().catch(() => null);
      isJson = true;
    } else {
      responseData = await res.text();
    }

    // Mask token in the echoed URL for safety
    const safeUrl = finalUrl.replace(new RegExp(effectiveToken, "g"), "***");

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
      latencyMs,
      contentType,
      isJson,
      headers: responseHeaders,
      data: responseData,
      url: safeUrl,
      method,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to execute request";
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
