#!/usr/bin/env node

import { copyFile, mkdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(scriptDir, "..");
const outputRoot = resolve(auditRoot, "dist");
const publicFiles = [
  ["report.html", "index.html"],
  ["report.html", "report.html"],
  ["report.zh.html", "report.zh.html"],
  ["report.ja.html", "report.ja.html"],
  ["report.ko.html", "report.ko.html"],
  ["README.md", "README.md"],
];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const [source, destination] of publicFiles) {
  const sourcePath = resolve(auditRoot, source);
  const destinationPath = resolve(outputRoot, destination);
  const sourceStats = await stat(sourcePath);
  if (!sourceStats.isFile() || sourceStats.size === 0) {
    throw new Error(`public input must be a non-empty file: ${source}`);
  }
  await copyFile(sourcePath, destinationPath);
}

const [indexHtml, englishHtml] = await Promise.all([
  readFile(resolve(outputRoot, "index.html"), "utf8"),
  readFile(resolve(outputRoot, "report.html"), "utf8"),
]);
if (indexHtml !== englishHtml) throw new Error("index.html must equal the canonical English report");

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    output: "dist",
    files: publicFiles.map(([, destination]) => destination),
  })}\n`,
);
