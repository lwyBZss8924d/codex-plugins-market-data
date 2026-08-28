# OpenAI Native Registry

The dashboard follows the OpenAI Data Analytics packaged reader as its UI/VI foundation. Registry Cartography is only the content model: manifests, market sources, runtime boundaries, counts, and commit hashes determine hierarchy and labels without introducing a competing brand skin.

## Official UI foundation

- Surfaces, borders, type, focus, overlays, dialogs, tables, and light/dark appearance use the reader's Codex/OpenAI tokens.
- Metric cards use `--codex-radius-md` (8px) rather than the default 16px panel radius.
- Metric chips use 4px corners; comparison bars are square-ended.
- Data comparison charts use the reader's primary blue sequential treatment.
- The cross-market scatter alone uses supported semantic categorical color to encode relative emphasis.
- No custom font, gradient, texture, shadow system, or external CSS dependency is introduced.

## Information glyphs

Monochrome glyphs act as compact semantic labels rather than decoration:

- `◉` live/universal
- `◇` CLI marketplace catalog
- `◆` Git package source
- `▦` package capability
- `⌘` interface
- `↔` market-source/filter
- `◌` App package references

## Radius system

| Tier | Token | Components |
| --- | ---: | --- |
| Data mark | `--audit-radius-data: 0px` | Every horizontal chart bar; no decorative rounding in quantitative geometry |
| Inline highlight | `--audit-radius-highlight: 3px` | Structured Markdown highlight labels such as `INDEX SCOPE` |
| Compact control | `--audit-radius-control: 4px` | Metric chips, source chips, chart legends, pagination, language switch, filter chips |
| Card | `--audit-radius-card: 8px` | Metric cards and portable fallback cards |
| Overlay | `--audit-radius-modal: 8px` | Data-source dialog, menus, and tooltips |
| Circular exception | `--audit-radius-icon: 9999px` / `50%` | Close, info, and overflow icon buttons plus data legend dots only; never text-bearing labels or navigation |

The generated reports expose all six tokens in one refinement layer. The report verifier asserts the token/selector contract and rejects rounded SVG bar paths; browser acceptance then checks computed radii on the rendered reader. This keeps radius changes systematic instead of component-by-component.

## Signature and restraint

The market-source ledger remains the single content signature: `3,322 raw → hide 10 CLI-only rows → 3,312 PTY-visible`. Metric-card body clicks reuse the existing Data source dialog; the options menu remains intact. The compact language switch and formal footer use the same token vocabulary. Everything else stays quiet and native to the verified reader.
