#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(scriptDir, "..");
const outputRoot = resolve(auditRoot, "dist");
const publicFiles = [
  "index.html",
  "report.html",
  "report.zh.html",
  "report.ja.html",
  "report.ko.html",
  "README.md",
];
const forbiddenPublicState =
  /pty_installed|pty_enabled|cli_enabled|runtime_app_catalog|installed_table|tui_installed|disabledInstalled|installedPlugins/u;

const contents = new Map();
for (const file of publicFiles) {
  const filePath = resolve(outputRoot, file);
  const fileStats = await stat(filePath);
  assert.equal(fileStats.isFile(), true, `${file} must be a file`);
  assert.ok(fileStats.size > 0, `${file} must not be empty`);
  contents.set(file, await readFile(filePath, "utf8"));
}

assert.equal(contents.get("index.html"), contents.get("report.html"));
for (const localeFile of ["report.html", "report.zh.html", "report.ja.html", "report.ko.html"]) {
  const html = contents.get(localeFile);
  assert.match(html, /Codex \| ChatGPT/u);
  assert.match(html, /audit-language-switch/u);
  assert.match(html, /audit-footer/u);
  assert.doesNotMatch(html, forbiddenPublicState);
  assert.doesNotMatch(html, /\/Users\/arthur/u);
}

const vercelConfig = JSON.parse(await readFile(resolve(auditRoot, "vercel.json"), "utf8"));
assert.equal(vercelConfig.buildCommand, "npm run site:build");
assert.equal(vercelConfig.installCommand, "npm install --ignore-scripts");
assert.equal(vercelConfig.outputDirectory, "dist");

const packageManifest = JSON.parse(await readFile(resolve(auditRoot, "package.json"), "utf8"));
assert.equal(packageManifest.packageManager, "npm@11.6.0");

const workflow = await readFile(resolve(auditRoot, ".github", "workflows", "ci.yml"), "utf8");
assert.match(workflow, /pull_request:/u);
assert.match(workflow, /push:/u);
assert.match(workflow, /npm run ci/u);

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    publicFiles,
    publicState: "absent",
    vercelOutput: vercelConfig.outputDirectory,
  })}\n`,
);
