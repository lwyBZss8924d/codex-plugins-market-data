#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(scriptDir, "..");
const snapshotPath = resolve(process.argv[2] ?? resolve(auditRoot, "data", "snapshot.json"));
const artifactPath = resolve(process.argv[3] ?? resolve(auditRoot, "artifact.json"));

const sum = (rows, field = "count") =>
  rows.reduce((total, row) => total + Number(row[field] ?? 0), 0);

export function validateSnapshot(snapshot, artifact) {
  const checks = [];
  const check = (name, callback) => {
    callback();
    checks.push({ name, status: "passed" });
  };

  check("CLI marketplace rows reconcile", () => {
    assert.equal(
      sum(snapshot.cli.localSnapshot.byMarketplace, "total"),
      snapshot.cli.localSnapshot.total,
    );
  });

  check("Public snapshot excludes local plugin state", () => {
    for (const [label, value] of [
      ["cli", snapshot.cli],
      ["cli.localSnapshot", snapshot.cli.localSnapshot],
      ["appServer.raw", snapshot.appServer.raw],
      ["appServer.tuiProjection", snapshot.appServer.tuiProjection],
      ["ptyObservation", snapshot.ptyObservation],
    ]) {
      for (const field of ["installed", "enabled", "disabledInstalled", "uninstalled", "installedPlugins", "features"]) {
        assert.equal(Object.hasOwn(value, field), false, `${label}.${field} must not be published`);
      }
    }
  });

  check("TUI categories reconcile", () => {
    assert.equal(sum(snapshot.appServer.tuiProjection.categories), snapshot.appServer.tuiProjection.total);
  });

  check("Git marketplace categories reconcile", () => {
    assert.equal(
      sum(snapshot.repositories.plugins.main.categories),
      snapshot.repositories.plugins.main.total,
    );
    assert.equal(
      sum(snapshot.repositories.plugins.api.categories),
      snapshot.repositories.plugins.api.total,
    );
  });

  check("API marketplace is a strict subset", () => {
    assert.equal(snapshot.repositories.plugins.apiSubsetOfMain, true);
    assert.equal(
      snapshot.repositories.plugins.main.total - snapshot.repositories.plugins.api.total,
      snapshot.repositories.plugins.mainNotApi.length,
    );
  });

  check("TUI hidden marketplace explains raw difference", () => {
    const hidden = new Set(snapshot.appServer.tuiProjection.hiddenMarketplaces);
    const hiddenRows = snapshot.appServer.raw.marketplaces.filter((row) => hidden.has(row.name));
    assert.equal(
      snapshot.appServer.raw.total - sum(hiddenRows, "total"),
      snapshot.appServer.tuiProjection.total,
    );
  });

  check("Direct PTY observation matches the TUI catalog view", () => {
    assert.equal(snapshot.ptyObservation.matchesProjection, true);
  });

  check("Repository manifests and directories reconcile", () => {
    assert.equal(snapshot.repositories.plugins.directories, snapshot.repositories.plugins.manifests);
    assert.equal(
      snapshot.repositories.plugins.components.physical.appFiles,
      snapshot.repositories.plugins.components.manifestDeclarations.apps,
    );
    assert.equal(
      snapshot.repositories.plugins.components.physical.mcpFiles,
      snapshot.repositories.plugins.components.mcpServers.total,
    );
  });

  check("Artifact uses one dashboard surface", () => {
    assert.equal(artifact.surface, "dashboard");
    assert.equal(artifact.manifest.surface, "dashboard");
    assert.equal(artifact.snapshot.status, "ready");
  });

  check("Artifact source references resolve", () => {
    const ids = new Set(artifact.sources.map((source) => source.id));
    for (const card of artifact.manifest.cards) assert.ok(ids.has(card.sourceId));
    for (const chart of artifact.manifest.charts) assert.ok(ids.has(chart.sourceId));
    for (const table of artifact.manifest.tables) assert.ok(ids.has(table.sourceId));
    for (const block of artifact.manifest.blocks) {
      if (block.sourceId) assert.ok(ids.has(block.sourceId));
    }
  });

  check("Native artifact sources contain executed SQLite queries", () => {
    const sourceMap = new Map(artifact.sources.map((source) => [source.id, source]));
    const nativeItems = [
      ...artifact.manifest.cards,
      ...artifact.manifest.charts,
      ...artifact.manifest.tables,
    ];
    for (const item of nativeItems) {
      const source = sourceMap.get(item.sourceId);
      const sql = source?.query?.sql?.replace(/^\s*(?:--[^\n]*\n\s*)+/u, "").trim();
      assert.match(sql ?? "", /^(?:SELECT|WITH)\b/iu);
      assert.equal(source.path, "queries/dashboard.sql");
    }
  });

  check("Artifact headline values match snapshot", () => {
    const headline = artifact.snapshot.datasets.summary[0];
    assert.equal(headline.universal_plugins, snapshot.appServer.tuiProjection.total);
    assert.equal(headline.cli_plugins, snapshot.cli.localSnapshot.total);
    assert.equal(headline.repo_plugins, snapshot.repositories.plugins.main.total);
    assert.equal(headline.api_plugins, snapshot.repositories.plugins.api.total);
  });

  return checks;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [snapshot, artifact] = await Promise.all([
    readFile(snapshotPath, "utf8").then(JSON.parse),
    readFile(artifactPath, "utf8").then(JSON.parse),
  ]);
  const checks = validateSnapshot(snapshot, artifact);
  process.stdout.write(
    `${JSON.stringify(
      { status: "passed", checks: checks.length, details: checks },
      null,
      2,
    )}\n`,
  );
}
