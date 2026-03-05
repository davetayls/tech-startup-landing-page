import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { hostname } from "node:os";

const { UNIFORM_PROJECT_ID, UNIFORM_API_KEY, UNIFORM_CLI_BASE_URL } =
  process.env;

if (!UNIFORM_PROJECT_ID || !UNIFORM_API_KEY || !UNIFORM_CLI_BASE_URL) {
  console.error(
    "Missing required env vars: UNIFORM_PROJECT_ID, UNIFORM_API_KEY, UNIFORM_CLI_BASE_URL"
  );
  process.exit(1);
}

const headers = {
  "x-api-key": UNIFORM_API_KEY,
  Accept: "application/json",
};

// List all data sources
const listUrl = new URL("/api/v1/data-sources", UNIFORM_CLI_BASE_URL);
listUrl.searchParams.set("projectId", UNIFORM_PROJECT_ID);

console.log("Fetching data source list...");

const listResponse = await fetch(listUrl, { headers });

if (!listResponse.ok) {
  console.error(`API request failed: ${listResponse.status} ${listResponse.statusText}`);
  console.error(await listResponse.text());
  process.exit(1);
}

const { results } = await listResponse.json();
console.log(`Found ${results.length} data source(s)`);

// Fetch each data source individually to get full details with decrypted secrets
const outDir = resolve("uniform-backup/data-source");
mkdirSync(outDir, { recursive: true });

for (const ds of results) {
  const dsUrl = new URL(`/api/v1/data-source`, UNIFORM_CLI_BASE_URL);
  dsUrl.searchParams.set("projectId", UNIFORM_PROJECT_ID);
  dsUrl.searchParams.set("dataSourceId", ds.id);

  console.log(`Fetching "${ds.displayName}" (${ds.id})...`);

  const dsResponse = await fetch(dsUrl, { headers });

  if (!dsResponse.ok) {
    console.error(`  Failed: ${dsResponse.status} ${dsResponse.statusText}`);
    console.error(`  ${await dsResponse.text()}`);
    process.exit(1);
  }

  const data = await dsResponse.json();
  const outPath = resolve(outDir, `${ds.id}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n");
  console.log(`  Saved to ${outPath}`);
}

// Write metadata
const metadataPath = resolve("uniform-backup/metadata.json");
writeFileSync(
  metadataPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      projectId: UNIFORM_PROJECT_ID,
      host: hostname(),
    },
    null,
    2
  ) + "\n"
);
console.log(`Saved metadata to ${metadataPath}`);

console.log("Backup complete.");
