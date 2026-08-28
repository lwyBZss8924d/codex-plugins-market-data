#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const reportPath = resolve(process.argv[2] ?? "report.html");
const locale = process.argv[3] ?? "en";
const snapshotPath = resolve(process.argv[4] ?? "data/snapshot.json");
if (!["en", "zh", "ja", "ko"].includes(locale)) {
  throw new Error(`unsupported locale: ${locale}`);
}
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
const snapshotDate = String(snapshot.generatedAt).slice(0, 10);
const snapshotTimestamp = String(snapshot.generatedAt);
let html = await readFile(reportPath, "utf8");
const squareBarPathPattern = /L\s*([-\d.]+),([-\d.]+)A\s*[\d.]+,[\d.]+,0,0,1,\s*([-\d.]+),([-\d.]+)L\s*([-\d.]+),([-\d.]+)A\s*[\d.]+,[\d.]+,0,0,1,\s*([-\d.]+),([-\d.]+)/gu;
const squareBarPathData = (data) =>
  data.replace(
    squareBarPathPattern,
    (match, insetTopX, topY, outerTopX, topInsetY, outerBottomX, bottomInsetY, insetBottomX, bottomY) =>
      `L ${outerTopX},${topY}L ${outerBottomX},${bottomY}L ${insetBottomX},${bottomY}`,
  );
let squaredStaticBars = 0;
html = html.replace(/d="([^"]+)"/gu, (attribute, data) => {
  const squared = squareBarPathData(data);
  if (squared === data) return attribute;
  squaredStaticBars += 1;
  return `d="${squared}"`;
});

const styleMarker = "codex-audit-openai-refinements";
const scriptMarker = "codex-audit-direct-source-interaction";
if (html.includes(styleMarker) || html.includes(scriptMarker)) {
  throw new Error("report enhancement markers already exist; rebuild the canonical report first");
}
if (!html.includes("</head>") || !html.includes("</body>")) {
  throw new Error("portable report is missing closing head/body tags");
}

const style = `<style id="${styleMarker}">
:root {
  --audit-radius-data: 0px;
  --audit-radius-highlight: 3px;
  --audit-radius-control: 4px;
  --audit-radius-card: var(--codex-radius-md, 8px);
  --audit-radius-modal: 8px;
  --audit-radius-icon: 9999px;
}
.report-metric-card {
  border-radius: var(--audit-radius-card) !important;
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
}
.analytics-layout-item-shell,
.report-markdown-editor {
  border-radius: var(--audit-radius-card) !important;
}
.analytics-reader-freshness {
  border-radius: var(--audit-radius-control) !important;
}
.report-metric-card:hover {
  border-color: var(--color-border-default, var(--ds-border));
}
.portable-metric-card,
.portable-content-card,
.portable-notice,
.portable-table-scroll {
  border-radius: var(--audit-radius-card);
}
.chip,
.portable-metric-badge,
.portable-status,
.portable-filter-chip,
.chart-legend-button,
.table-arrow-button {
  border-radius: var(--audit-radius-control) !important;
}
.table-page-control > span[data-audit-localized-page] {
  font-size: 0;
}
.table-page-control > span[data-audit-localized-page]::after {
  content: attr(data-audit-localized-page);
  font-size: 12px;
}
.report-markdown-editor code {
  border-radius: var(--audit-radius-highlight) !important;
}
.native-modal.source-modal,
.modal-panel.source-modal-panel,
[role="menu"],
[role="tooltip"] {
  border-radius: var(--audit-radius-modal) !important;
}
.modal-close-button,
.kpi-info,
.viz-card-menu-button {
  border-radius: var(--audit-radius-icon) !important;
}
.audit-language-switch {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--color-border-default, rgba(127, 127, 127, 0.2));
  border-radius: var(--audit-radius-control);
  background: var(--color-background-primary, Canvas);
  font: 500 11px/1.4 var(--codex-font-sans, ui-sans-serif, system-ui, sans-serif);
}
.audit-language-switch a {
  padding: 3px 7px;
  border-radius: var(--audit-radius-control);
  color: inherit;
  text-decoration: none;
}
.audit-language-switch a[aria-current="page"] {
  background: var(--color-background-secondary, rgba(127, 127, 127, 0.12));
}
.audit-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 48px;
  padding: 20px 32px calc(20px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--color-border-default, rgba(127, 127, 127, 0.18));
  color: var(--color-text-secondary, #8f8f8f);
  font: 500 12px/1.5 var(--codex-font-sans, ui-sans-serif, system-ui, sans-serif);
}
.audit-footer nav {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 12px;
}
.audit-footer a {
  color: inherit;
  text-underline-offset: 3px;
}
@media (prefers-color-scheme: dark) {
  html,
  body,
  #data-analytics-portable-reader,
  #data-analytics-portable-reader-root {
    background-color: #212121 !important;
  }
}
@media (max-width: 560px) {
  .analytics-top-bar {
    flex-wrap: wrap;
    row-gap: 4px;
  }
  .analytics-top-bar-actions {
    width: 100%;
    justify-content: space-between;
  }
  .analytics-top-bar-actions .audit-language-switch {
    order: -1;
  }
  .audit-footer {
    align-items: flex-start;
    flex-direction: column;
    padding-right: 24px;
    padding-left: 24px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .report-metric-card { transition: none; }
}
</style>`;

const languageOptions = [
  { code: "en", label: "EN", href: "report.html" },
  { code: "zh", label: "中文", href: "report.zh.html" },
  { code: "ja", label: "日本語", href: "report.ja.html" },
  { code: "ko", label: "한국어", href: "report.ko.html" },
];
const footerCopy = {
  en: {
    summary: `Snapshot ${snapshotDate} · Reproducible metadata index`,
    readme: "Methodology",
    github: "GitHub",
    docs: "OpenAI Plugins docs",
    sourceTitle: "View data source",
    languageLabel: "Language",
    updated: "Last updated",
  },
  zh: {
    summary: `快照 ${snapshotDate} · 可复现元数据索引`,
    readme: "方法说明",
    github: "GitHub",
    docs: "OpenAI 插件文档",
    sourceTitle: "查看数据来源",
    languageLabel: "语言",
    updated: "更新于",
  },
  ja: {
    summary: `スナップショット ${snapshotDate} · 再現可能なメタデータ索引`,
    readme: "方法論",
    github: "GitHub",
    docs: "OpenAI プラグイン文書",
    sourceTitle: "データソースを表示",
    languageLabel: "言語",
    updated: "最終更新",
  },
  ko: {
    summary: `스냅샷 ${snapshotDate} · 재현 가능한 메타데이터 인덱스`,
    readme: "방법론",
    github: "GitHub",
    docs: "OpenAI 플러그인 문서",
    sourceTitle: "데이터 소스 보기",
    languageLabel: "언어",
    updated: "마지막 업데이트",
  },
};
const commonTranslations = {
  zh: {
    "Data source": "数据来源",
    Overview: "概览",
    "Data preview": "数据预览",
    "SQL query": "SQL 查询",
    "Copy query": "复制查询",
    Metric: "指标",
    Definition: "定义",
    Dataset: "数据集",
    "Data snapshot": "数据快照",
    "Tables used": "使用的数据表",
    Filters: "筛选条件",
    "Previous page": "上一页",
    "Next page": "下一页",
  },
  ja: {
    "Data source": "データソース",
    Overview: "概要",
    "Data preview": "データプレビュー",
    "SQL query": "SQL クエリ",
    "Copy query": "クエリをコピー",
    Metric: "指標",
    Definition: "定義",
    Dataset: "データセット",
    "Data snapshot": "データスナップショット",
    "Tables used": "使用テーブル",
    Filters: "フィルター",
    "Previous page": "前のページ",
    "Next page": "次のページ",
  },
  ko: {
    "Data source": "데이터 소스",
    Overview: "개요",
    "Data preview": "데이터 미리보기",
    "SQL query": "SQL 쿼리",
    "Copy query": "쿼리 복사",
    Metric: "지표",
    Definition: "정의",
    Dataset: "데이터셋",
    "Data snapshot": "데이터 스냅샷",
    "Tables used": "사용된 테이블",
    Filters: "필터",
    "Previous page": "이전 페이지",
    "Next page": "다음 페이지",
  },
};

const script = `<script id="${scriptMarker}">
(() => {
  const locale = ${JSON.stringify(locale)};
  const languageOptions = ${JSON.stringify(languageOptions)};
  const footerCopy = ${JSON.stringify(footerCopy[locale])};
  const commonTranslations = ${JSON.stringify(commonTranslations[locale] ?? {})};
  const languageTags = { en: "en", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR" };
  const snapshotTimestamp = ${JSON.stringify(snapshotTimestamp)};
  const squareBarPathPattern = new RegExp(${JSON.stringify(squareBarPathPattern.source)}, "gu");
  document.documentElement.lang = languageTags[locale];

  const cardSelector = ".report-metric-card";
  const decorateCards = () => {
    document.querySelectorAll(cardSelector).forEach((card) => {
      card.dataset.directSourceCard = "true";
      card.title = footerCopy.sourceTitle;
    });
  };
  const squareChartBars = () => {
    document.querySelectorAll('svg path[d*="A "]').forEach((path) => {
      if (!path.closest('[data-artifact-kind="chart"]')) return;
      const data = path.getAttribute("d");
      const squared = data.replace(
        squareBarPathPattern,
        (match, insetTopX, topY, outerTopX, topInsetY, outerBottomX, bottomInsetY, insetBottomX, bottomY) =>
          "L " + outerTopX + "," + topY + "L " + outerBottomX + "," + bottomY + "L " + insetBottomX + "," + bottomY,
      );
      if (squared !== data) {
        path.setAttribute("d", squared);
        path.dataset.squareBar = "true";
      }
    });
  };
  const createLink = (label, href) => {
    const link = document.createElement("a");
    link.textContent = label;
    link.href = href;
    return link;
  };
  const ensureLanguageSwitch = () => {
    let nav = document.getElementById("audit-language-switch");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "audit-language-switch";
      nav.className = "audit-language-switch";
      nav.setAttribute("aria-label", footerCopy.languageLabel);
      for (const option of languageOptions) {
        const link = createLink(option.label, option.href);
        link.hreflang = option.code;
        link.lang = option.code;
        if (option.code === locale) link.setAttribute("aria-current", "page");
        nav.append(link);
      }
    }
    const host = document.querySelector(".analytics-top-bar-actions");
    if (host && nav.parentElement !== host) host.prepend(nav);
    else if (!host && !nav.parentElement) document.body.append(nav);
  };
  const ensureFooter = () => {
    if (document.getElementById("audit-footer")) return;
    const footer = document.createElement("footer");
    footer.id = "audit-footer";
    footer.className = "audit-footer";
    const summary = document.createElement("span");
    summary.textContent = footerCopy.summary;
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", footerCopy.readme);
    nav.append(
      createLink(footerCopy.readme, "README.md"),
      createLink(footerCopy.github, "https://github.com/lwyBZss8924d/codex-plugins-market-data"),
      createLink(footerCopy.docs, "https://learn.chatgpt.com/docs/plugins"),
    );
    footer.append(summary, nav);
    document.body.append(footer);
  };
  const translateCommonUi = () => {
    const translateDynamicText = (text) => {
      let match = text.match(/^(\\d+) results$/u);
      if (match) {
        return {
          zh: match[1] + " 条结果",
          ja: match[1] + " 件",
          ko: match[1] + "개 결과",
        }[locale] ?? text;
      }
      match = text.match(/^Page (\\d+) of (\\d+)$/u);
      if (match) {
        return {
          zh: "第 " + match[1] + " / " + match[2] + " 页",
          ja: match[1] + " / " + match[2] + " ページ",
          ko: match[1] + " / " + match[2] + " 페이지",
        }[locale] ?? text;
      }
      return text;
    };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, #audit-language-switch, #audit-footer")) continue;
      const text = node.nodeValue;
      const trimmed = text.trim();
      const translated = commonTranslations[trimmed] ?? translateDynamicText(trimmed);
      if (translated && translated !== trimmed) node.nodeValue = text.replace(trimmed, translated);
    }
    for (const element of document.querySelectorAll(".table-result-count")) {
      const text = element.textContent.trim();
      const translated = translateDynamicText(text);
      if (translated !== text) element.textContent = translated;
    }
    for (const element of document.querySelectorAll(".table-page-control > span")) {
      const text = element.textContent.trim();
      const translated = translateDynamicText(text);
      if (translated !== text) {
        element.dataset.auditLocalizedPage = translated;
        element.setAttribute("aria-label", translated);
      } else {
        delete element.dataset.auditLocalizedPage;
        element.removeAttribute("aria-label");
      }
    }
    for (const element of document.querySelectorAll("[aria-label]")) {
      const label = element.getAttribute("aria-label");
      const translated = commonTranslations[label];
      if (translated) element.setAttribute("aria-label", translated);
    }
  };
  const localizeFreshness = () => {
    const element = document.querySelector(".analytics-top-bar-freshness");
    const text = element?.querySelector(".top-bar-refresh-text");
    if (!element || !text) return;
    const localized = new Intl.DateTimeFormat(languageTags[locale], {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(snapshotTimestamp));
    if (text.textContent !== localized) text.textContent = localized;
    const label = footerCopy.updated + " " + localized;
    if (element.getAttribute("aria-label") !== label) element.setAttribute("aria-label", label);
  };
  const enhance = () => {
    decorateCards();
    squareChartBars();
    ensureLanguageSwitch();
    ensureFooter();
    translateCommonUi();
    localizeFreshness();
  };
  const openSource = (card) => {
    const options = card.querySelector('[data-artifact-action="open-options"][data-artifact-kind="card"]');
    if (!options) return;
    options.click();
    window.setTimeout(() => {
      const menus = [...document.querySelectorAll('[role="menu"]')];
      const visibleMenu = menus.find((menu) => menu.getClientRects().length > 0);
      visibleMenu?.querySelector('[data-artifact-action="view-source"]')?.click();
    }, 40);
  };
  document.addEventListener("click", (event) => {
    const card = event.target.closest?.(cardSelector);
    if (!card) return;
    if (event.target.closest?.('button, a, [role="menu"], dialog, [data-artifact-action]')) return;
    openSource(card);
  });
  new MutationObserver(enhance).observe(document.documentElement, {
    characterData: true,
    childList: true,
    subtree: true,
  });
  enhance();
})();
</script>`;

html = html.replace("</head>", `${style}\n</head>`).replace("</body>", `${script}\n</body>`);
await writeFile(reportPath, html, "utf8");
process.stdout.write(
  `${JSON.stringify({
    ok: true,
    report: reportPath,
    locale,
    radiusSystem: {
      data: "0px",
      highlight: "3px",
      control: "4px",
      card: "8px",
      modal: "8px",
      iconOnly: "9999px",
    },
    directMetricCardSource: true,
    squaredStaticBars,
    squareChartBars: true,
    languageSwitch: true,
    footer: true,
  })}\n`,
);
