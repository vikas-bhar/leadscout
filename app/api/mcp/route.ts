import { NextRequest, NextResponse } from "next/server";
import { handleMCPRequest, MCP_TOOLS, MCP_RESOURCES, MCP_PROMPTS } from "@/lib/mcp";
import { requireApiUser } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const results = await Promise.all(body.map((r) => handleMCPRequest(r)));
      return NextResponse.json(results);
    }

    const response = await handleMCPRequest(body);
    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal MCP server error";
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.user) return auth.response;

  return NextResponse.json({
    status: "online",
    name: "LeadScout MCP Server",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    description: "Model Context Protocol interface for LeadScout Lead Discovery & AI Pitch Automation.",
    endpoints: {
      jsonRpc: "/api/mcp",
    },
    toolsCount: MCP_TOOLS.length,
    tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    resources: MCP_RESOURCES,
    prompts: MCP_PROMPTS,
  });
}
