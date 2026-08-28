import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { validateSnapshot } from "../scripts/validate-snapshot.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(testDir, "..");

async function load() {
  const [snapshot, artifact] = await Promise.all([
    readFile(resolve(auditRoot, "data", "snapshot.json"), "utf8").then(JSON.parse),
    readFile(resolve(auditRoot, "artifact.json"), "utf8").then(JSON.parse),
  ]);
  return { snapshot, artifact };
}

test("snapshot and artifact pass the audit contract", async () => {
  const { snapshot, artifact } = await load();
  assert.ok(validateSnapshot(snapshot, artifact).length >= 10);
});

test("every native visual has an adjacent explanatory markdown block", async () => {
  const { artifact } = await load();
  const blocks = artifact.manifest.blocks;
  for (let index = 0; index < blocks.length; index += 1) {
    if (blocks[index].type !== "chart") continue;
    assert.ok(
      blocks[index - 1]?.type === "markdown" || blocks[index + 1]?.type === "markdown",
      `chart block ${blocks[index].id} needs adjacent explanatory markdown`,
    );
  }
});

test("dashboard datasets are bounded and non-empty", async () => {
  const { artifact } = await load();
  for (const [name, rows] of Object.entries(artifact.snapshot.datasets)) {
    assert.ok(Array.isArray(rows), `${name} must be an array`);
    assert.ok(rows.length > 0, `${name} must not be empty`);
    assert.ok(rows.length <= 200, `${name} exceeds the audit dashboard bound`);
  }
});

test("visual signature and bounded ranking stay in the canonical artifact", async () => {
  const { artifact } = await load();
  const blocks = artifact.manifest.blocks;
  const summaryIndex = blocks.findIndex((block) => block.id === "technical_summary");
  const projectionIndex = blocks.findIndex((block) => block.id === "inventory_planes");
  assert.equal(projectionIndex, summaryIndex + 1);
  assert.equal(blocks[projectionIndex].type, "chart");

  const componentChart = artifact.manifest.charts.find(
    (chart) => chart.id === "component_counts_chart",
  );
  assert.equal(componentChart.type, "horizontalBar");
  assert.equal(componentChart.palette.kind, "sequential");

  const interfaceChart = artifact.manifest.charts.find(
    (chart) => chart.id === "interfaces_chart",
  );
  assert.equal(interfaceChart.type, "horizontalBar");
  assert.equal(interfaceChart.palette.kind, "sequential");

  const scatter = artifact.manifest.charts.find(
    (chart) => chart.id === "category_positioning_chart",
  );
  assert.equal(scatter.type, "scatter");
  assert.equal(artifact.snapshot.datasets.category_positioning.length, 14);
  assert.equal(scatter.encodings.x.field, "universal_share");
  assert.equal(scatter.encodings.y.field, "git_share");

  assert.equal(artifact.manifest.charts.length, 9);
  assert.deepEqual(
    artifact.manifest.tables.map((table) => table.id).sort(),
    ["api_exclusions_table"],
  );

  const packageArchitecture = artifact.manifest.charts.find(
    (chart) => chart.id === "package_capability_chart",
  );
  assert.equal(packageArchitecture.type, "horizontalBar");
  assert.equal(packageArchitecture.dataset, "package_archetypes");
  assert.equal(artifact.snapshot.datasets.package_archetypes.length, 6);
  assert.equal(
    artifact.snapshot.datasets.package_archetypes.reduce(
      (total, row) => total + row.package_count,
      0,
    ),
    62,
  );
  assert.equal(artifact.snapshot.datasets.package_index.length, 62);
});

test("public artifact excludes account-local plugin state", async () => {
  const { artifact } = await load();
  const forbiddenFields = new Set([
    "pty_installed",
    "pty_enabled",
    "cli_enabled",
    "runtime_app_catalog",
  ]);
  const summary = artifact.snapshot.datasets.summary[0];
  for (const field of forbiddenFields) assert.equal(Object.hasOwn(summary, field), false);
  assert.equal(Object.hasOwn(artifact.snapshot.datasets, "tui_installed"), false);
  assert.equal(
    artifact.manifest.tables.some((table) => table.id === "installed_table"),
    false,
  );
  for (const card of artifact.manifest.cards) {
    for (const metric of card.metrics) assert.equal(forbiddenFields.has(metric.field), false);
  }
});

test("dashboard narrative is scan-friendly and uses structured highlights", async () => {
  const { artifact } = await load();
  const highlightStrip = artifact.manifest.blocks.find((block) => block.id === "audit_highlights");
  assert.equal(highlightStrip.type, "metric-strip");
  assert.equal(highlightStrip.cardIds.length, 4);

  const markdownBlocks = artifact.manifest.blocks.filter((block) => block.type === "markdown");
  for (const block of markdownBlocks) {
    assert.ok(block.body.length <= 650, `${block.id} exceeds the scan-friendly narrative bound`);
  }
});

test("metadata links and provider insights stay evidence-backed", async () => {
  const { snapshot, artifact } = await load();
  assert.equal(artifact.manifest.title, "Codex | ChatGPT Plugins Index");
  assert.equal(snapshot.repositories.plugins.packageIndex.length, 62);
  assert.equal(snapshot.repositories.plugins.providerInsights.metadataCoverage.urlLinked, 62);
  assert.equal(artifact.snapshot.datasets.third_party_categories.length, 14);
  assert.equal(artifact.snapshot.datasets.top_third_party_providers.length, 8);

  for (const row of snapshot.repositories.plugins.packageIndex) {
    assert.match(row.url, /^https?:\/\//u);
    assert.ok(row.urlSource);
  }
  for (const blockId of ["provider_links", "package_links"]) {
    const body = artifact.manifest.blocks.find((block) => block.id === blockId)?.body ?? "";
    assert.match(body, /\[[^\]]+\]\(https?:\/\//u);
  }
});
