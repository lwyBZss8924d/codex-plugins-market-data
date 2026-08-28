# Codex | ChatGPT Plugins Index

**Skills / Plugins / Apps Package Market Data Insights**

This repository is a reproducible, metadata-backed index of the Codex and ChatGPT plugin ecosystem as observed on 2026-08-28. Its primary deliverable is [report.html](report.html), a self-contained interactive dashboard that works offline and includes direct source dialogs, verified SQLite provenance, metadata URLs, semantic chart fallbacks, responsive layouts, and EN / 中文 / 日本語 / 한국어 editions.

Localized dashboard entry points: [English](report.html) · [中文](report.zh.html) · [日本語](report.ja.html) · [한국어](report.ko.html)

GitHub destination: <https://github.com/lwyBZss8924d/codex-plugins-market-data>

The audit deliberately keeps four different market sources and catalog views separate:

| Source / view | Meaning | Current count |
| --- | --- | ---: |
| Codex PTY `/plugins` | User-visible universal directory after TUI-only filtering | 3,312 |
| Codex CLI marketplace catalogs | `codex plugin list --available --json` across configured marketplace sources | 195 |
| `openai/plugins` standard marketplace | Curated Git marketplace in the checked-out official repository | 62 |
| `openai/plugins` API-key marketplace | API-key-compatible subset in the same repository | 46 |

These counts are not supposed to match. ChatGPT and Codex share one universal public plugin directory, while the CLI command, the TUI, the runtime bundles, and the Git repository expose different market sources and catalog snapshots of it.

## Repository contents

- `scripts/collect.mjs` queries the installed Codex CLI and App Server, scans the two OpenAI source checkouts, and writes a normalized snapshot.
- `queries/dashboard.sql` contains the thirteen SQLite queries that materially produce every exposed card, chart, and table dataset.
- `scripts/build-artifact.mjs` loads the normalized snapshot into in-memory SQLite, executes those queries with row-count and key-NULL checks, and writes the canonical Data Analytics `artifact.json` dashboard contract.
- `scripts/validate-snapshot.mjs` independently checks category sums, marketplace sums, API-subset membership, TUI filtering, and artifact/source integrity.
- `scripts/deliver-report.sh` invokes the OpenAI Data Analytics portable-artifact builder to create and verify all four localized reports.
- `scripts/localize-artifact.mjs` creates the three localized artifact contracts while preserving identifiers, URLs, SQL, and numeric evidence.
- `scripts/enhance-report.mjs` applies bounded OpenAI-native refinements: the centralized 0/3/4/8px radius system, square chart bars, direct card-to-source interaction, header language navigation, a lighter dark canvas, and the formal footer.
- `data/snapshot.json` is the bounded evidence snapshot used by the committed report.
- `artifact.json` is the canonical dashboard source. `report.html` is generated output, intentionally committed for direct use.
- `evidence/pty-observation.json` records the real read-only `/plugins` PTY observation used to cross-check the App Server catalog view.
- `DESIGN.md` records the audience, metric model, chart map, source rules, and visual QA decisions.
- `THEME.md` defines the OpenAI Native Registry visual language and its constrained semantic glyph system.

## Metadata insights

- Universal directory: 3,259 third-party plugin rows across 2,857 named third-party providers.
- Provider website coverage: 3,195 of 3,312 rows (96.5%).
- Official Git marketplace: all 62 package manifests have named provider and URL metadata; 36 are third-party and 26 are OpenAI.
- App-reference provider mix: 52 OpenAI references and 22 third-party references.
- Package structure is analyzed across immediate Skills, Apps, MCP servers, commands, and agents at one-row-per-package grain, then grouped into six mutually exclusive capability archetypes for a readable market-composition view.
- Clickable provider/package links use exact metadata with recorded URL provenance; no URLs are synthesized.

## Reproduce

Requirements: Node.js with `node:sqlite` (tested with Node 26.3.1), Git, an authenticated `codex` CLI, and local checkouts at `../openai/codex` and `../openai/plugins` relative to this repository.

```bash
npm run refresh
```

To rebuild only from the committed snapshot:

```bash
npm run build
```

To run the same self-contained checks used by pull requests and assemble the Vercel bundle:

```bash
npm run ci
```

## CI/CD and public deployment

- GitHub repository: <https://github.com/lwyBZss8924d/codex-plugins-market-data>
- Vercel team: [`sj112358s-projects`](https://vercel.com/sj112358s-projects)
- Vercel project: `codex-chatgpt-plugins-index`
- Production site: <https://codex-chatgpt-plugins-index.vercel.app>

The [CI workflow](.github/workflows/ci.yml) runs on every pull request and every push to `main`. It validates the committed snapshot and SQLite-backed artifact, checks all four enhanced reports, builds the bounded `dist/` publication bundle, and verifies that account-local plugin state is absent.

Vercel Git integration owns deployment automation: pull-request branches receive preview deployments and the merged `main` branch receives the production deployment. No Vercel credential is stored in this repository or required by the GitHub Actions workflow. The static build publishes only `index.html`, the four named report entry points, and `README.md`.

Public Git notes intentionally cover only the first remote root commit and CI/CD deployment events. To inspect them:

```bash
git fetch origin refs/notes/commits:refs/notes/commits
git log --show-notes=commits -1
```

For local review, serve the repository and open the generated dashboard:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then visit <http://localhost:8765/report.html>.

Override checkout locations without editing the scripts:

```bash
CODEX_REPO=/path/to/codex \
OPENAI_PLUGINS_REPO=/path/to/plugins \
npm run refresh
```

The collector never installs, removes, enables, disables, or upgrades a plugin or marketplace. It uses read-only commands and JSON-RPC list/read endpoints. A future refresh should also repeat the real `/plugins` PTY check and update `evidence/pty-observation.json` if the visible catalog changes.

## Methodology and public-data boundary

1. The collector captures catalog-level counts and metadata from the Codex CLI/App Server, the checked-out `openai/codex` interfaces, and the checked-out `openai/plugins` marketplace manifests.
2. It normalizes each market source or catalog view without merging unlike denominators: PTY-visible universal directory, raw App Server directory, CLI marketplace catalogs, standard Git marketplace, and API-key Git subset.
3. Provider scope is derived only from explicit developer/author metadata. Exact link precedence is `interface.websiteURL`, then manifest `homepage`, `repository`, and `author.url`; no provider or package URL is synthesized.
4. Thirteen named SQLite queries materially produce the dashboard datasets. The artifact builder enforces row-count parity and non-null key checks, then the independent validator reconciles category totals, market-source filtering, package archetypes, and API subset membership.
5. The committed public snapshot deliberately excludes local plugin state: no Installed, Enabled, Disabled, callable, or per-install package list is persisted in `data/snapshot.json`, `artifact.json`, or any generated report. A contract test prevents those fields from returning during refresh.
6. Browser acceptance covers desktop, mobile, light/dark appearance, four-language navigation, direct source-dialog interaction, footer links, and horizontal overflow. Local QA recordings and screenshots remain outside the public repository.

Refresh cadence is intentionally manual because the universal directory is live while the two Git repositories and managed catalog sources advance independently. Run `npm run refresh`, repeat PTY/browser acceptance, inspect the diff, and publish only after all contracts pass.

## Source definitions and caveats

- The universal-directory count is live and account-dependent; it can change without a Git commit.
- The CLI `openai-curated` catalog is a managed on-disk source and can have a different revision and cardinality from the current `openai/plugins` checkout.
- The current TUI intentionally hides the `openai-bundled` marketplace. The dashboard reconciles the raw App Server response to the PTY total using that source-code rule.
- App counts in the public index describe manifest App references and unique App ids, not account-specific runtime availability.
- Official product semantics are grounded in [OpenAI Plugins documentation](https://learn.chatgpt.com/docs/plugins) and [OpenAI plugin architecture](https://developers.openai.com/plugins/concepts/plugins).
