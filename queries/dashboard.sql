-- name: summary
-- EXPECTED: 1 row because the dashboard headline snapshot is a singleton.
SELECT
  universal_plugins,
  raw_plugins,
  hidden_bundled,
  cli_plugins,
  repo_plugins,
  api_plugins,
  api_coverage,
  productivity_plugins,
  business_ops_plugins,
  top_two_category_share,
  git_developer_plugins,
  git_developer_share,
  skill_entrypoints,
  plugins_with_skills,
  app_references_total,
  unique_app_ids,
  third_party_plugins,
  third_party_share,
  distinct_third_party_providers,
  provider_website_linked,
  provider_website_coverage,
  git_third_party_packages,
  git_third_party_share,
  third_party_app_references,
  third_party_app_share,
  git_url_coverage
FROM summary;

-- name: inventory_planes
-- EXPECTED: 5 rows because the audit defines five distinct market sources and catalog views.
SELECT plane, source, total, freshness
FROM inventory_planes
ORDER BY total DESC, plane ASC;

-- name: tui_categories
-- EXPECTED: one row per TUI-visible universal-directory category.
SELECT category, count, rank, share
FROM tui_categories
ORDER BY count DESC, category ASC;

-- name: third_party_categories
-- EXPECTED: 14 rows because third-party packages span all 14 universal-directory categories.
SELECT category, plugin_count, provider_count, share
FROM third_party_categories
ORDER BY plugin_count DESC, category ASC;

-- name: top_third_party_providers
-- EXPECTED: 8 rows because the dashboard keeps a bounded top-provider comparison.
SELECT provider, plugin_count, category_count, url, sample_plugins
FROM top_third_party_providers
ORDER BY plugin_count DESC, category_count DESC, provider ASC;

-- name: repo_categories
-- EXPECTED: one row per standard openai/plugins marketplace category.
SELECT category, count, rank, share
FROM repo_categories
ORDER BY count DESC, category ASC;

-- name: category_positioning
-- EXPECTED: 14 rows because the union contains 14 category names across the two market views.
WITH categories AS (
  SELECT category FROM tui_categories
  UNION
  SELECT category FROM repo_categories
),
combined AS (
  SELECT
    categories.category,
    COALESCE(tui_categories.count, 0) AS universal_count,
    COALESCE(tui_categories.share, 0.0) AS universal_share,
    COALESCE(repo_categories.count, 0) AS git_count,
    COALESCE(repo_categories.share, 0.0) AS git_share
  FROM categories
  LEFT JOIN tui_categories USING (category)
  LEFT JOIN repo_categories USING (category)
)
SELECT
  category,
  universal_count,
  universal_share,
  git_count,
  git_share,
  git_share - universal_share AS share_delta,
  CASE
    WHEN git_share - universal_share > 0.01 THEN 'Git over-index'
    WHEN git_share - universal_share < -0.01 THEN 'Universal over-index'
    ELSE 'Near parity'
  END AS relative_emphasis
FROM combined
ORDER BY ABS(git_share - universal_share) DESC, category ASC;

-- name: cli_marketplaces
-- EXPECTED: 3 rows because the CLI reports three configured marketplace catalogs.
SELECT marketplace, total
FROM cli_marketplaces
ORDER BY total DESC, marketplace ASC;

-- name: component_counts_chart
-- EXPECTED: 7 rows because the chart compares seven overlapping plugin package surfaces.
SELECT component, count
FROM component_counts_chart
ORDER BY count DESC, component ASC;

-- name: package_index
-- EXPECTED: 62 rows because the official Git marketplace contains 62 package manifests.
SELECT
  name,
  display_name,
  provider,
  provider_scope,
  category,
  url,
  url_source,
  skill_entrypoints,
  app_references,
  mcp_servers,
  command_files,
  agent_files
FROM package_index
ORDER BY skill_entrypoints DESC, app_references DESC, name ASC;

-- name: package_archetypes
-- EXPECTED: 6 rows because the 62 package manifests occupy six mutually exclusive Skills/Apps/MCP combinations.
SELECT
  architecture,
  package_count,
  share,
  openai_packages,
  third_party_packages,
  skill_entrypoints,
  app_references,
  mcp_servers,
  examples
FROM package_archetypes
ORDER BY package_count DESC, architecture ASC;

-- name: interfaces
-- EXPECTED: 6 rows because the audit separates six CLI, TUI, request, and notification layers.
SELECT layer, count, examples
FROM interfaces
ORDER BY count DESC, layer ASC;

-- name: api_exclusions
-- EXPECTED: one row per standard-marketplace name excluded from the API-key subset.
SELECT plugin, standardMarketplace, apiKeyMarketplace
FROM api_exclusions
ORDER BY plugin ASC;
