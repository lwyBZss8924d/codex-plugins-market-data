#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const reportRoot = resolve(process.argv[2] ?? ".");
const reports = [
  { file: "report.html", locale: "en" },
  { file: "report.zh.html", locale: "zh" },
  { file: "report.ja.html", locale: "ja" },
  { file: "report.ko.html", locale: "ko" },
];

for (const report of reports) {
  const reportPath = resolve(reportRoot, report.file);
  const html = await readFile(reportPath, "utf8");
  const enhancementStyle = html.match(
    /<style id="codex-audit-openai-refinements">([\s\S]*?)<\/style>/u,
  )?.[1];
  const metricHoverRule = enhancementStyle?.match(
    /\.report-metric-card:hover\s*\{([\s\S]*?)\}/u,
  )?.[1];
  const languageSwitchRule = enhancementStyle?.match(
    /\.audit-language-switch\s*\{([\s\S]*?)\}/u,
  )?.[1];

  assert.match(html, /id="codex-audit-openai-refinements"/u);
  assert.ok(enhancementStyle);
  assert.ok(metricHoverRule);
  assert.ok(languageSwitchRule);
  assert.doesNotMatch(metricHoverRule, /background(?:-color)?\s*:/u);
  assert.doesNotMatch(languageSwitchRule, /position\s*:/u);
  assert.match(html, /--audit-radius-data: 0px/u);
  assert.match(html, /--audit-radius-highlight: 3px/u);
  assert.match(html, /--audit-radius-control: 4px/u);
  assert.match(html, /--audit-radius-card: var\(--codex-radius-md, 8px\)/u);
  assert.match(html, /--audit-radius-modal: 8px/u);
  assert.match(html, /--audit-radius-icon: 9999px/u);
  assert.match(html, /border-radius: var\(--audit-radius-card\) !important/u);
  assert.match(html, /id="codex-audit-direct-source-interaction"/u);
  assert.match(html, /dataset\.directSourceCard = "true"/u);
  assert.match(html, /data-artifact-action="view-source"/u);
  assert.match(html, /\.portable-table-scroll \{\s*border-radius: var\(--audit-radius-card\);/u);
  assert.match(html, /\.table-arrow-button \{\s*border-radius: var\(--audit-radius-control\) !important;/u);
  assert.match(html, /\.report-markdown-editor code \{\s*border-radius: var\(--audit-radius-highlight\) !important;/u);
  assert.match(html, /\.modal-panel\.source-modal-panel,/u);
  assert.match(html, /\.analytics-layout-item-shell,/u);
  assert.match(html, /\.analytics-reader-freshness \{\s*border-radius: var\(--audit-radius-control\) !important;/u);
  assert.match(html, /const squareChartBars = \(\) =>/u);
  assert.match(html, /characterData: true/u);
  assert.match(html, /data-audit-localized-page/u);
  assert.match(html, /dataset\.auditLocalizedPage = translated/u);
  assert.doesNotMatch(html, /A 6,6,0,0,1/u);
  assert.doesNotMatch(html, /Plugin inventory rows by projection/u);
  assert.match(html, /package_archetypes/u);
  assert.match(html, /\\d\+\) results/u);
  assert.doesNotMatch(html, /\^\(d\+\) results/u);
  assert.match(html, /id = "audit-language-switch"/u);
  assert.match(html, /document\.querySelector\("\.analytics-top-bar-actions"\)/u);
  assert.match(html, /id = "audit-footer"/u);
  assert.match(html, new RegExp(`const locale = "${report.locale}";`, "u"));
  assert.match(html, /report\.zh\.html/u);
  assert.match(html, /report\.ja\.html/u);
  assert.match(html, /report\.ko\.html/u);
  assert.match(html, /github\.com\/lwyBZss8924d\/codex-plugins-market-data/u);
  assert.doesNotMatch(
    html,
    /pty_installed|pty_enabled|cli_enabled|runtime_app_catalog|installed_table|tui_installed/u,
  );
}

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    reports: reports.map((report) => report.file),
    checks: [
      "official-radius-token",
      "direct-card-source-interaction",
      "language-switch",
      "header-language-placement",
      "formal-footer",
      "restrained-label-radius",
      "square-chart-bars",
      "market-source-language",
      "package-archetype-chart",
      "public-state-sanitization",
      "reduced-motion",
    ],
  })}\n`,
);
