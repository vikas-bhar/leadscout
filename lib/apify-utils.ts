export function formatDuration(ms?: number): string {
  if (!ms && ms !== 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(2);
  if (ms < 60000) return `${seconds}s`;
  const mins = Math.floor(ms / 60000);
  const remainingSecs = ((ms % 60000) / 1000).toFixed(1);
  return `${mins}m ${remainingSecs}s`;
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toISOString().replace("T", " ").replace("Z", " UTC");
  } catch {
    return isoString;
  }
}

export function maskToken(token: string): string {
  if (!token) return "token=***";
  if (token.length <= 12) return "••••••••";
  return `${token.slice(0, 10)}••••${token.slice(-4)}`;
}

export function downloadJsonFile(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvFile(items: Record<string, unknown>[], filename: string) {
  if (!items || items.length === 0) return;

  const headers = Array.from(
    new Set(
      items.flatMap((item) =>
        Object.keys(item).filter(
          (k) => typeof item[k] === "string" || typeof item[k] === "number" || typeof item[k] === "boolean"
        )
      )
    )
  );

  const csvRows = [
    headers.join(","),
    ...items.map((row) =>
      headers
        .map((header) => {
          const val = row[header];
          if (val === null || val === undefined) return '""';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadTextFile(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildCurlCommand(
  url: string,
  method: "GET" | "POST" = "GET",
  token: string = "***",
  body?: unknown
): string {
  let finalUrl = url;
  if (!finalUrl.includes("token=")) {
    const sep = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${sep}token=${token}`;
  } else {
    finalUrl = finalUrl.replace(/token=[^&]*/, `token=${token}`);
  }

  if (method === "GET") {
    return `curl -s -X GET "${finalUrl}"`;
  }

  if (body) {
    return `curl -s -X POST "${finalUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(body, null, 2)}'`;
  }

  return `curl -s -X POST "${finalUrl}"`;
}

export function buildNodeJsSnippet(
  endpointId: string,
  ids: { runId: string; kvsId: string; datasetId: string },
  token: string = "APIFY_TOKEN"
): string {
  switch (endpointId) {
    case "get-run":
      return `import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || '${token}',
});

const run = await client.run('${ids.runId}').get();
console.log('Run details:', run);`;

    case "get-input":
      return `import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || '${token}',
});

const input = await client.keyValueStore('${ids.kvsId}').getRecord('INPUT');
console.log('Run Input:', input?.value);`;

    case "get-dataset":
      return `import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || '${token}',
});

const { items } = await client.dataset('${ids.datasetId}').listItems({
  limit: 100,
});
console.log('Dataset items count:', items.length);`;

    case "get-log":
      return `import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || '${token}',
});

const log = await client.log('${ids.runId}').get();
console.log('Run log:', log);`;

    case "abort-run":
      return `import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || '${token}',
});

const run = await client.run('${ids.runId}').abort();
console.log('Run aborted:', run);`;

    case "resurrect-run":
      return `import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN || '${token}',
});

const run = await client.run('${ids.runId}').resurrect();
console.log('Run resurrected:', run);`;

    default:
      return `// Apify client call for ${endpointId}`;
  }
}

export function buildPythonSnippet(
  endpointId: string,
  ids: { runId: string; kvsId: string; datasetId: string }
): string {
  switch (endpointId) {
    case "get-run":
      return `from apify_client import ApifyClient
import os

client = ApifyClient(os.getenv("APIFY_TOKEN"))
run = client.run("${ids.runId}").get()
print("Run Status:", run["status"])`;

    case "get-input":
      return `from apify_client import ApifyClient
import os

client = ApifyClient(os.getenv("APIFY_TOKEN"))
kvs_client = client.key_value_store("${ids.kvsId}")
input_record = kvs_client.get_record("INPUT")
print("Input:", input_record["value"])`;

    case "get-dataset":
      return `from apify_client import ApifyClient
import os

client = ApifyClient(os.getenv("APIFY_TOKEN"))
dataset_client = client.dataset("${ids.datasetId}")
items = dataset_client.list_items().items
print(f"Retrieved {len(items)} items")`;

    case "get-log":
      return `from apify_client import ApifyClient
import os

client = ApifyClient(os.getenv("APIFY_TOKEN"))
log = client.log("${ids.runId}").get()
print("Log:", log)`;

    case "abort-run":
      return `from apify_client import ApifyClient
import os

client = ApifyClient(os.getenv("APIFY_TOKEN"))
run = client.run("${ids.runId}").abort()
print("Aborted:", run)`;

    case "resurrect-run":
      return `from apify_client import ApifyClient
import os

client = ApifyClient(os.getenv("APIFY_TOKEN"))
run = client.run("${ids.runId}").resurrect()
print("Resurrected:", run)`;

    default:
      return `# Python snippet for ${endpointId}`;
  }
}
