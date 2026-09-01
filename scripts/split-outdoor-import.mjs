import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("imports", process.argv[2] || "outdoor-malaysia.json");
const rows = JSON.parse(await readFile(source, "utf8"));

if (!Array.isArray(rows)) throw new Error("The source import must be a JSON array.");

const byState = new Map();
for (const row of rows) {
  if (!row?.state) continue;
  if (!byState.has(row.state)) byState.set(row.state, []);
  byState.get(row.state).push(row);
}

for (const [state, candidates] of byState) {
  const slug = state.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const filename = resolve("imports", `outdoor-${slug}-all.json`);
  await writeFile(filename, `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
  process.stdout.write(`Saved ${candidates.length} candidates to ${filename}\n`);
}
