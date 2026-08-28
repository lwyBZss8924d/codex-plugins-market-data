# Dashboard design contract

## Audience and decision

- Audience: technical Codex/plugin maintainers and advanced users auditing market coverage.
- Primary question: how many plugins are visible from each market source or catalog view, where do they come from, and why do the counts differ?
- Primary action: select the correct market source or catalog view before quoting a count or debugging marketplace availability.
- Snapshot model: bounded point-in-time evidence, not a live operating dashboard.

## Aesthetic direction

The selected direction is [OpenAI Native Registry](THEME.md): the official Data Analytics reader owns the product UI/VI, while registry and market-source semantics only organize content. The single signature is the market-source reconciliation ledger. Monochrome glyph labels improve scanning without adding a competing icon or brand system.

The alternative skill routes were intentionally bounded:

- Static Canvas output was rejected as the primary surface because it cannot preserve exact tables, source dialogs, sorting, or responsive interaction.
- A second React/Tailwind artifact was rejected because the packaged reader already supplies the required state and interactions and has stronger same-payload verification.

## Information architecture

1. Hero metrics establish the live universal directory, CLI marketplace catalogs, official Git marketplace, skill surface, and App surface.
2. A one-line orientation and market-source comparison chart define the denominators without a document-style executive summary.
3. Four structured highlight cards expose source-view delta, live-category concentration, Git developer mix, and API-key coverage.
4. Provider cards and charts expose third-party share, metadata coverage, category breadth, and top-provider concentration.
5. Chart-led sections compare marketplace-source composition, cross-market category emphasis, and mutually exclusive Skills/Apps/MCP package archetypes.
6. Only the genuine API-key exclusion lookup remains a table; package/provider destinations remain direct metadata links.
7. Methodology and refresh guidance live in README; the report ends with a compact site footer.

## Chart map

| Section | Question | Family / form | Dataset | Palette policy | Supported takeaway |
| --- | --- | --- | --- | --- | --- |
| Market sources | Which source or catalog view is being counted? | Comparison / square-ended horizontal bar | `inventory_planes` | OpenAI primary blue | Universal and raw App Server views are much larger than CLI/Git catalogs. |
| Live directory categories | Where is the universal directory concentrated? | Comparison / horizontal bar | `tui_categories` | Single blue sequential root | Productivity and business/operations dominate the live directory. |
| Third-party categories | Where do non-OpenAI packages and providers concentrate? | Comparison / horizontal bar | `third_party_categories` | Single blue sequential root | Productivity leads plugin count; Business & Operations leads provider breadth. |
| Top third-party providers | Which named providers publish the most plugins? | Ranking / horizontal bar | `top_third_party_providers` | Single blue sequential root | The largest providers remain small relative to 2,857 third-party providers. |
| Cross-market category positioning | Which categories over-index in Git versus the universal directory? | Relationship / labeled scatter | `category_positioning` | Semantic categorical | Developer Tools over-index in Git; business/finance/travel over-index in universal. |
| CLI marketplaces | Which catalog source contributes most CLI-visible rows? | Comparison / horizontal bar | `cli_marketplaces` | Single blue sequential root | The managed curated source contributes most of the 195 catalog rows. |
| Plugin package surfaces | How much reusable surface exists inside the 62 Git packages? | Comparison / square-ended horizontal bar | `component_counts_chart` | OpenAI primary blue | Skills are the largest package surface; Apps, commands, MCP, and agents are complementary. |
| Package architecture | How are packages composed from Skills, Apps, and MCP? | Composition / square-ended horizontal bar | `package_archetypes` | OpenAI primary blue | Six mutually exclusive archetypes replace an overplotted package scatter and expose the dominant capability combinations. |
| Interface layers | How is the management/discovery surface divided? | Comparison / square-ended horizontal bar | `interfaces` | OpenAI primary blue | Plugin RPC has the broadest method surface. |

Magnitude bars use a zero baseline, square ends, exact tooltips, direct category labels, neutral titles, visible scope subtitles, and no redundant legends. The remaining scatter has 14 same-grain labeled category points and explicit fractional-share denominators. Package archetypes are mutually exclusive and sum to all 62 packages. Ordering, labels, glyphs, and semantic fallbacks preserve meaning without relying on color alone.

## Layout sketch

```text
┌──────────────────────────────────────────────────────────┐
│ headline context: universal · CLI · Git · skills · Apps │
├──────────────────────────────────────────────────────────┤
│ technical summary                                        │
├──────────────────────────────────────────────────────────┤
│ SIGNATURE: market-source reconciliation ledger           │
├──────────────────────────────┬───────────────────────────┤
│ category maps · scatter     │ exact source dialogs      │
├──────────────────────────────┴───────────────────────────┤
│ package archetypes · interfaces · API exclusions         │
└──────────────────────────────────────────────────────────┘
```

## Source and metric rules

- `available` means a row returned by the named market source or catalog view, not a globally unique product.
- Public datasets retain catalog-level availability only; local Installed, Enabled, Disabled, callable, and per-install package-list fields are excluded by contract.
- Category counts are mutually exclusive within each marketplace file or App Server response and must sum to the corresponding total.
- The API-key marketplace must be a name-level subset of the standard Git marketplace.
- The TUI total equals the raw default App Server response minus marketplaces intentionally hidden by the TUI source code.
- Package archetypes are mutually exclusive presence combinations over manifest-declared Skills, Apps, and MCP surfaces; their counts must sum to the 62-package Git marketplace.
- Physical files and manifest declarations are reported separately; file presence is not silently treated as an active manifest declaration.

## Interaction and accessibility

- The portable reader is read-only and offline; it exposes chart details, sortable tables, and source dialogs without edit, refresh, install, or share actions.
- Clicking a metric-card body opens its existing Data source dialog directly; nested info/options controls keep their original behavior.
- Metric cards use the reader's smaller Codex radius token and reduced-motion-safe hover feedback.
- The radius system is centralized in [THEME.md](THEME.md): 0px data marks, 3px highlights, 4px text controls, 8px cards/overlays, and circles only for icon-only controls. Static verification plus rendered computed-style QA guard the contract.
- Responsive QA targets desktop and narrow layouts.
- EN is the canonical default; 中文, 日本語, and 한국어 are self-contained sibling reports linked by an accessible language switch.
- The builder-generated semantic fallback preserves narratives, metrics, charts as tables, exact detail tables, and source provenance without JavaScript.
- System light/dark appearance remains controlled by the shared Data Analytics reader.
