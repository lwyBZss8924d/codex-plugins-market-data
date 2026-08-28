#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const auditRoot = resolve(scriptDir, "..");
const codexRepo = resolve(process.env.CODEX_REPO ?? join(auditRoot, "..", "openai", "codex"));
const pluginsRepo = resolve(
  process.env.OPENAI_PLUGINS_REPO ?? join(auditRoot, "..", "openai", "plugins"),
);
const outputPath = resolve(process.env.AUDIT_OUTPUT ?? join(auditRoot, "data", "snapshot.json"));
const cacheRoot = join(homedir(), ".codex", ".tmp", "plugins");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed (${result.status}): ${result.stderr || result.stdout}`,
    );
  }
  return result.stdout.trim();
}

function runOptional(command, args, options = {}) {
  try {
    return run(command, args, options);
  } catch {
    return null;
  }
}

function runJson(command, args, options = {}) {
  return JSON.parse(run(command, args, options));
}

function countBy(rows, selector) {
  const counts = new Map();
  for (const row of rows) {
    const key = selector(row) ?? "Uncategorized";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

function safeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function providerScope(provider) {
  if (!provider || provider === "Unspecified") return "Unspecified";
  const normalized = provider.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
  return normalized === "openai" || normalized === "openaiinc" ? "OpenAI" : "Third-party";
}

function aggregateProviders(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.provider;
    const group = groups.get(key) ?? {
      provider: key,
      providerScope: row.providerScope,
      pluginCount: 0,
      categories: new Set(),
      urls: new Set(),
      samplePlugins: [],
    };
    group.pluginCount += 1;
    if (row.category) group.categories.add(row.category);
    if (row.url) group.urls.add(row.url);
    if (group.samplePlugins.length < 3) group.samplePlugins.push(row.plugin);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      provider: group.provider,
      providerScope: group.providerScope,
      pluginCount: group.pluginCount,
      categoryCount: group.categories.size,
      categories: [...group.categories].sort(),
      url: group.urls.size === 1 ? [...group.urls][0] : null,
      urlCoverage: group.urls.size,
      samplePlugins: group.samplePlugins,
    }))
    .sort(
      (left, right) =>
        right.pluginCount - left.pluginCount ||
        right.categoryCount - left.categoryCount ||
        left.provider.localeCompare(right.provider),
    );
}

function total(rows, field = "count") {
  return rows.reduce((sum, row) => sum + Number(row[field] ?? 0), 0);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isDirectory(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function walkFiles(root) {
  const files = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isDirectory() && [".git", "node_modules", "dist", "target"].includes(entry.name)) {
        continue;
      }
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  await walk(root);
  return files;
}

function marketplaceSummary(document) {
  const plugins = document.plugins ?? [];
  return {
    name: document.name,
    displayName: document.interface?.displayName ?? null,
    total: plugins.length,
    categories: countBy(plugins, (plugin) => plugin.category),
    authentication: countBy(plugins, (plugin) => plugin.policy?.authentication),
    productScope: {
      codexOnly: plugins.filter(
        (plugin) =>
          Array.isArray(plugin.policy?.products) &&
          plugin.policy.products.length === 1 &&
          plugin.policy.products[0] === "CODEX",
      ).length,
      unrestricted: plugins.filter((plugin) => !Array.isArray(plugin.policy?.products)).length,
    },
    sourceTypes: countBy(plugins, (plugin) => plugin.source?.source),
    names: plugins.map((plugin) => plugin.name).sort(),
  };
}

function gitSnapshot(repo) {
  const [ahead = 0, behind = 0] = (
    runOptional("git", ["rev-list", "--left-right", "--count", "HEAD...origin/main"], { cwd: repo }) ??
    "0 0"
  )
    .split(/\s+/)
    .map(Number);
  const status = run("git", ["status", "--short", "--branch"], { cwd: repo });
  const lines = status.split("\n");
  return {
    head: run("git", ["rev-parse", "HEAD"], { cwd: repo }),
    originMain: runOptional("git", ["rev-parse", "origin/main"], { cwd: repo }),
    committedAt: run("git", ["show", "-s", "--format=%cI", "HEAD"], { cwd: repo }),
    subject: run("git", ["show", "-s", "--format=%s", "HEAD"], { cwd: repo }),
    branchStatus: lines[0],
    clean: lines.length === 1,
    ahead,
    behind,
  };
}

function summarizePluginMarketplaces(marketplaces) {
  const rows = marketplaces.flatMap((marketplace) =>
    marketplace.plugins.map((plugin) => ({ marketplace: marketplace.name, ...plugin })),
  );
  const providerRows = rows.map((plugin) => {
    const provider = plugin.interface?.developerName?.trim() || "Unspecified";
    return {
      provider,
      providerScope: providerScope(provider),
      plugin: plugin.interface?.displayName ?? plugin.name,
      category: plugin.interface?.category ?? "Uncategorized",
      url: safeHttpUrl(plugin.interface?.websiteUrl),
    };
  });
  const thirdPartyRows = providerRows.filter((row) => row.providerScope === "Third-party");
  const providerAggregates = aggregateProviders(providerRows);
  const thirdPartyCategories = countBy(thirdPartyRows, (row) => row.category).map((category) => ({
    ...category,
    providerCount: new Set(
      thirdPartyRows
        .filter((row) => row.category === category.name)
        .map((row) => row.provider),
    ).size,
  }));
  return {
    marketplaces: marketplaces.map((marketplace) => ({
      name: marketplace.name,
      displayName: marketplace.interface?.displayName ?? null,
      local: marketplace.path != null,
      total: marketplace.plugins.length,
      categories: countBy(marketplace.plugins, (plugin) => plugin.interface?.category),
    })),
    total: rows.length,
    categories: countBy(rows, (plugin) => plugin.interface?.category),
    sourceTypes: countBy(rows, (plugin) => plugin.source?.type),
    installPolicies: countBy(rows, (plugin) => plugin.installPolicy),
    authPolicies: countBy(rows, (plugin) => plugin.authPolicy),
    availability: countBy(rows, (plugin) => plugin.availability),
    providerInsights: {
      scope: countBy(providerRows, (row) => row.providerScope),
      distinctNamedProviders: new Set(
        providerRows.filter((row) => row.provider !== "Unspecified").map((row) => row.provider),
      ).size,
      distinctThirdPartyProviders: new Set(thirdPartyRows.map((row) => row.provider)).size,
      thirdPartyPlugins: thirdPartyRows.length,
      metadataCoverage: {
        developerNamed: providerRows.filter((row) => row.provider !== "Unspecified").length,
        websiteLinked: providerRows.filter((row) => row.url).length,
        both: providerRows.filter((row) => row.provider !== "Unspecified" && row.url).length,
      },
      thirdPartyCategories,
      topThirdPartyProviders: providerAggregates
        .filter((row) => row.providerScope === "Third-party")
        .slice(0, 12),
      linkedThirdPartyProviders: providerAggregates
        .filter((row) => row.providerScope === "Third-party" && row.url)
        .slice(0, 8),
    },
  };
}

function appServerClient() {
  const child = spawn("codex", ["app-server", "--stdio"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: process.env,
  });
  let buffer = "";
  let stderr = "";
  let nextId = 1;
  const pending = new Map();

  child.stderr.on("data", (chunk) => {
    if (stderr.length < 16_000) stderr += chunk.toString();
  });
  child.stdout.on("data", (chunk) => {
    buffer += chunk.toString();
    for (;;) {
      const newline = buffer.indexOf("\n");
      if (newline < 0) break;
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (!line.trim()) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        continue;
      }
      const waiting = pending.get(message.id);
      if (!waiting) continue;
      clearTimeout(waiting.timer);
      pending.delete(message.id);
      if (message.error) waiting.reject(new Error(JSON.stringify(message.error)));
      else waiting.resolve(message.result);
    }
  });
  child.on("exit", (code) => {
    for (const waiting of pending.values()) {
      clearTimeout(waiting.timer);
      waiting.reject(new Error(`codex app-server exited ${code}: ${stderr}`));
    }
    pending.clear();
  });

  function request(method, params) {
    const id = nextId++;
    return new Promise((resolveRequest, rejectRequest) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        rejectRequest(new Error(`${method} timed out: ${stderr}`));
      }, 60_000);
      pending.set(id, { resolve: resolveRequest, reject: rejectRequest, timer });
      child.stdin.write(`${JSON.stringify({ method, id, params })}\n`);
    });
  }

  function notify(method, params) {
    child.stdin.write(`${JSON.stringify({ method, params })}\n`);
  }

  return {
    async initialize() {
      await request("initialize", {
        clientInfo: {
          name: "codex_cli",
          title: "Codex plugins market audit",
          version: "1.0.0",
        },
      });
      notify("initialized", {});
    },
    request,
    close() {
      child.kill("SIGTERM");
    },
  };
}

async function collectAppServer(cwd, hiddenMarketplaces) {
  const client = appServerClient();
  await client.initialize();
  try {
    const raw = await client.request("plugin/list", {
      cwds: [cwd],
      forceRefetch: false,
    });
    const sectionKinds = [
      "local",
      "vertical",
      "workspace-directory",
      "shared-with-me",
      "created-by-me-remote",
    ];
    const sections = {};
    for (const kind of sectionKinds) {
      const result = await client.request("plugin/list", {
        cwds: [cwd],
        marketplaceKinds: [kind],
        forceRefetch: false,
      });
      sections[kind] = {
        total: result.marketplaces.reduce(
          (sum, marketplace) => sum + marketplace.plugins.length,
          0,
        ),
        marketplaces: result.marketplaces.map((marketplace) => ({
          name: marketplace.name,
          total: marketplace.plugins.length,
        })),
        loadErrors: result.marketplaceLoadErrors ?? [],
      };
    }

    const rawSummary = summarizePluginMarketplaces(raw.marketplaces);
    const visibleMarketplaces = raw.marketplaces.filter(
      (marketplace) => !hiddenMarketplaces.includes(marketplace.name),
    );
    const tuiProjection = summarizePluginMarketplaces(visibleMarketplaces);
    return {
      raw: rawSummary,
      tuiProjection: {
        ...tuiProjection,
        hiddenMarketplaces,
      },
      sections,
      featuredPluginIds: raw.featuredPluginIds?.length ?? 0,
      marketplaceLoadErrors: raw.marketplaceLoadErrors ?? [],
    };
  } finally {
    client.close();
  }
}

function parseCommands(help) {
  return help
    .split("\n")
    .map((line) => line.match(/^  ([a-z][a-z-]*)\s{2,}/)?.[1])
    .filter((name) => name && name !== "help");
}

async function collectCli() {
  const marketplaces = runJson("codex", ["plugin", "marketplace", "list", "--json"]);
  const listing = runJson("codex", ["plugin", "list", "--available", "--json"]);
  const rows = [...listing.installed, ...listing.available];
  const byMarketplace = countBy(rows, (plugin) => plugin.marketplaceName).map((entry) => ({
    name: entry.name,
    total: entry.count,
  }));
  const pluginCommands = parseCommands(run("codex", ["plugin", "--help"]));
  const marketplaceCommands = parseCommands(run("codex", ["plugin", "marketplace", "--help"]));
  return {
    version: run("codex", ["--version"]),
    configuredMarketplaces: marketplaces.marketplaces.map((marketplace) => ({
      name: marketplace.name,
      sourceType: marketplace.marketplaceSource?.sourceType ?? "managed",
    })),
    localSnapshot: {
      total: rows.length,
      byMarketplace,
      authentication: countBy(rows, (plugin) => plugin.authPolicy),
      installPolicy: countBy(rows, (plugin) => plugin.installPolicy),
    },
    commands: {
      plugin: pluginCommands,
      marketplace: marketplaceCommands,
      leafCount:
        pluginCommands.filter((command) => command !== "marketplace").length +
        marketplaceCommands.length,
    },
  };
}

async function collectPluginsRepository() {
  const mainDocument = await readJson(join(pluginsRepo, ".agents", "plugins", "marketplace.json"));
  const apiDocument = await readJson(
    join(pluginsRepo, ".agents", "plugins", "api_marketplace.json"),
  );
  const main = marketplaceSummary(mainDocument);
  const api = marketplaceSummary(apiDocument);
  const pluginRoot = join(pluginsRepo, "plugins");
  const directories = (await readdir(pluginRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const manifests = [];
  const packageIndex = [];
  let pluginsWithSkillsDirectory = 0;
  let immediateSkillEntrypoints = 0;
  let allSkillMarkdown = 0;
  let appFiles = 0;
  let mcpFiles = 0;
  let pluginsWithCommands = 0;
  let commandFiles = 0;
  let pluginsWithAgents = 0;
  let agentFiles = 0;
  let hookFiles = 0;
  let lockFiles = 0;
  const appEntries = [];
  const mcpEntries = [];

  for (const name of directories) {
    const root = join(pluginRoot, name);
    const manifestPath = join(root, ".codex-plugin", "plugin.json");
    const manifest = (await isFile(manifestPath)) ? await readJson(manifestPath) : null;
    if (manifest) manifests.push(manifest);
    const provider =
      manifest?.interface?.developerName?.trim() || manifest?.author?.name?.trim() || "Unspecified";
    const category = manifest?.interface?.category ?? "Uncategorized";
    const urlCandidates = [
      ["interface.websiteURL", manifest?.interface?.websiteURL],
      ["homepage", manifest?.homepage],
      ["repository", manifest?.repository],
      ["author.url", manifest?.author?.url],
    ];
    const urlMetadata = urlCandidates
      .map(([source, value]) => ({ source, url: safeHttpUrl(value) }))
      .find((candidate) => candidate.url);
    let pluginImmediateSkills = 0;
    let pluginAllSkills = 0;
    let pluginCommandFiles = 0;
    let pluginAgentFiles = 0;
    let pluginAppReferences = 0;
    let pluginMcpServers = 0;
    if (await isDirectory(join(root, "skills"))) pluginsWithSkillsDirectory += 1;
    if (await isDirectory(join(root, "commands"))) pluginsWithCommands += 1;
    if (await isDirectory(join(root, "agents"))) pluginsWithAgents += 1;
    if (await isFile(join(root, "hooks.json"))) hookFiles += 1;
    if (await isFile(join(root, "plugin.lock.json"))) lockFiles += 1;

    const files = await walkFiles(root);
    for (const file of files) {
      const parts = relative(root, file).split(sep);
      if (basename(file) === "SKILL.md") {
        allSkillMarkdown += 1;
        pluginAllSkills += 1;
        if (parts.length === 3 && parts[0] === "skills") {
          immediateSkillEntrypoints += 1;
          pluginImmediateSkills += 1;
        }
      }
      if (parts.length === 2 && parts[0] === "commands") {
        commandFiles += 1;
        pluginCommandFiles += 1;
      }
      if (parts.length === 2 && parts[0] === "agents") {
        agentFiles += 1;
        pluginAgentFiles += 1;
      }
    }

    const appPath = join(root, ".app.json");
    if (await isFile(appPath)) {
      appFiles += 1;
      const appDocument = await readJson(appPath);
      for (const [appName, value] of Object.entries(appDocument.apps ?? {})) {
        pluginAppReferences += 1;
        appEntries.push({
          plugin: name,
          appName,
          provider,
          providerScope: providerScope(provider),
          pluginCategory: category,
          pluginUrl: urlMetadata?.url ?? null,
          ...value,
        });
      }
    }
    const mcpPath = join(root, ".mcp.json");
    if (await isFile(mcpPath)) {
      mcpFiles += 1;
      const mcpDocument = await readJson(mcpPath);
      for (const [serverName, value] of Object.entries(mcpDocument.mcpServers ?? {})) {
        pluginMcpServers += 1;
        const transport =
          value.type === "http" || (value.url && !value.command)
            ? "http"
            : value.command
              ? "stdio"
              : "other";
        mcpEntries.push({ plugin: name, serverName, transport, oauth: Boolean(value.oauth_resource) });
      }
    }
    packageIndex.push({
      name,
      plugin: name,
      displayName: manifest?.interface?.displayName ?? name,
      provider,
      providerScope: providerScope(provider),
      category,
      url: urlMetadata?.url ?? null,
      urlSource: urlMetadata?.source ?? null,
      skillEntrypoints: pluginImmediateSkills,
      allSkillFiles: pluginAllSkills,
      appReferences: pluginAppReferences,
      mcpServers: pluginMcpServers,
      commandFiles: pluginCommandFiles,
      agentFiles: pluginAgentFiles,
      hasHooks: Object.hasOwn(manifest ?? {}, "hooks") || (await isFile(join(root, "hooks.json"))),
    });
  }

  const appIdPrefix = (id) => {
    if (id.startsWith("asdk_app_")) return "asdk_app";
    if (id.startsWith("connector_")) return "connector";
    if (id.startsWith("templated_apps_")) return "templated_apps";
    return "other";
  };
  const mainNames = new Set(main.names);
  const apiNames = new Set(api.names);
  const linkedBy = (field, limit = 8) =>
    packageIndex
      .filter((plugin) => plugin.url && plugin[field] > 0)
      .sort(
        (left, right) =>
          right[field] - left[field] ||
          right.skillEntrypoints + right.appReferences -
            (left.skillEntrypoints + left.appReferences) ||
          left.displayName.localeCompare(right.displayName),
      )
      .slice(0, limit)
      .map((plugin) => ({
        name: plugin.name,
        displayName: plugin.displayName,
        provider: plugin.provider,
        category: plugin.category,
        url: plugin.url,
        urlSource: plugin.urlSource,
        value: plugin[field],
      }));
  const gitProviderAggregates = aggregateProviders(packageIndex);
  return {
    git: gitSnapshot(pluginsRepo),
    directories: directories.length,
    manifests: manifests.length,
    main,
    api,
    apiSubsetOfMain: [...apiNames].every((name) => mainNames.has(name)),
    mainNotApi: [...mainNames].filter((name) => !apiNames.has(name)).sort(),
    packageIndex: packageIndex.sort((left, right) => left.name.localeCompare(right.name)),
    packageLinks: {
      skills: linkedBy("skillEntrypoints"),
      apps: linkedBy("appReferences"),
      mcp: linkedBy("mcpServers"),
    },
    providerInsights: {
      scope: countBy(packageIndex, (plugin) => plugin.providerScope),
      distinctProviders: new Set(
        packageIndex.filter((plugin) => plugin.provider !== "Unspecified").map((plugin) => plugin.provider),
      ).size,
      metadataCoverage: {
        providerNamed: packageIndex.filter((plugin) => plugin.provider !== "Unspecified").length,
        urlLinked: packageIndex.filter((plugin) => plugin.url).length,
        both: packageIndex.filter((plugin) => plugin.provider !== "Unspecified" && plugin.url).length,
      },
      topProviders: gitProviderAggregates.slice(0, 12),
    },
    components: {
      manifestDeclarations: {
        skills: manifests.filter((manifest) => Object.hasOwn(manifest, "skills")).length,
        apps: manifests.filter((manifest) => Object.hasOwn(manifest, "apps")).length,
        mcpServers: manifests.filter((manifest) => Object.hasOwn(manifest, "mcpServers")).length,
        hooks: manifests.filter((manifest) => Object.hasOwn(manifest, "hooks")).length,
      },
      physical: {
        pluginsWithSkillsDirectory,
        immediateSkillEntrypoints,
        allSkillMarkdown,
        appFiles,
        mcpFiles,
        pluginsWithCommands,
        commandFiles,
        pluginsWithAgents,
        agentFiles,
        hookFiles,
        lockFiles,
      },
      appReferences: {
        total: appEntries.length,
        uniqueIds: new Set(appEntries.map((entry) => entry.id)).size,
        optional: appEntries.filter((entry) => entry.optional).length,
        idPrefixes: countBy(appEntries, (entry) => appIdPrefix(entry.id)),
        categories: countBy(appEntries, (entry) => entry.category ?? "Unspecified"),
        providerScope: countBy(appEntries, (entry) => entry.providerScope),
        providers: countBy(appEntries, (entry) => entry.provider),
      },
      mcpServers: {
        total: mcpEntries.length,
        transports: countBy(mcpEntries, (entry) => entry.transport),
        oauthResource: mcpEntries.filter((entry) => entry.oauth).length,
      },
    },
  };
}

async function collectCodexRepository() {
  const commonPath = join(
    codexRepo,
    "codex-rs",
    "app-server-protocol",
    "src",
    "protocol",
    "common.rs",
  );
  const backgroundPath = join(
    codexRepo,
    "codex-rs",
    "tui",
    "src",
    "app",
    "background_requests.rs",
  );
  const slashPath = join(codexRepo, "codex-rs", "tui", "src", "slash_command.rs");
  const startupPath = join(codexRepo, "codex-rs", "core-plugins", "src", "startup_sync.rs");
  const [common, background, slash, startup] = await Promise.all([
    readFile(commonPath, "utf8"),
    readFile(backgroundPath, "utf8"),
    readFile(slashPath, "utf8"),
    readFile(startupPath, "utf8"),
  ]);
  const methods = [
    ...new Set(
      [...common.matchAll(/=>\s*"((?:marketplace|plugin|app)\/[^"\s]+)"/g)].map(
        (match) => match[1],
      ),
    ),
  ].sort();
  const hiddenSection = background.match(
    /CLI_HIDDEN_PLUGIN_MARKETPLACES:\s*&\[&str\]\s*=\s*&\[([^\]]*)\]/,
  );
  const hiddenMarketplaces = hiddenSection
    ? [...hiddenSection[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
    : [];
  const startupConstant = (name) =>
    startup.match(new RegExp(`const ${name}: &str =\\s*"([^"]+)"`))?.[1] ?? null;
  return {
    git: gitSnapshot(codexRepo),
    interfaces: {
      marketplaceRequests: methods.filter((method) => method.startsWith("marketplace/")),
      pluginRequests: methods.filter((method) => method.startsWith("plugin/")),
      appRequests: methods.filter(
        (method) => method.startsWith("app/") && method !== "app/list/updated",
      ),
      appNotifications: methods.filter((method) => method === "app/list/updated"),
      slashPlugins: /\bPlugins,/.test(slash) && /SlashCommand::Plugins\s*=>\s*"browse plugins"/.test(slash),
      tuiHiddenMarketplaces: hiddenMarketplaces,
    },
    curatedSyncSources: {
      git: startupConstant("OPENAI_PLUGINS_GIT_URL"),
      backupExport: startupConstant("CURATED_PLUGINS_BACKUP_ARCHIVE_API_URL"),
    },
  };
}

async function collectCache() {
  if (!existsSync(cacheRoot)) return { available: false };
  const marketplacePath = join(cacheRoot, ".agents", "plugins", "marketplace.json");
  const shaPath = join(dirname(cacheRoot), "plugins.sha");
  const document = await readJson(marketplacePath);
  const sha = (await readFile(shaPath, "utf8")).trim();
  return {
    available: true,
    marketplace: marketplaceSummary(document),
    sha,
    git: gitSnapshot(cacheRoot),
    shaMatchesHead: sha === run("git", ["rev-parse", "HEAD"], { cwd: cacheRoot }),
  };
}

async function main() {
  for (const [label, path] of [
    ["Codex repository", codexRepo],
    ["OpenAI plugins repository", pluginsRepo],
  ]) {
    if (!(await isDirectory(path))) throw new Error(`${label} not found: ${path}`);
  }

  const generatedAt = new Date().toISOString();
  const [cli, codex, plugins, cache] = await Promise.all([
    collectCli(),
    collectCodexRepository(),
    collectPluginsRepository(),
    collectCache(),
  ]);
  const appServer = await collectAppServer(auditRoot, codex.interfaces.tuiHiddenMarketplaces);
  const ptyObservation = await readJson(join(auditRoot, "evidence", "pty-observation.json"));
  const snapshot = {
    schemaVersion: 1,
    generatedAt,
    collectorVersion: "1.0.0",
    inputs: {
      codexRepository: "~/dev-space/openai/codex",
      pluginsRepository: "~/dev-space/openai/plugins",
      managedCuratedCache: "~/.codex/.tmp/plugins",
    },
    officialDocs: {
      pluginArchitecture: "https://developers.openai.com/plugins/concepts/plugins",
      plugins: "https://learn.chatgpt.com/docs/plugins",
    },
    cli,
    appServer,
    repositories: { codex, plugins },
    managedCache: cache,
    ptyObservation: {
      ...ptyObservation,
      matchesProjection: ptyObservation.available === appServer.tuiProjection.total,
    },
    reconciliations: {
      cliMarketplaceTotal: total(cli.localSnapshot.byMarketplace, "total"),
      tuiCategoryTotal: total(appServer.tuiProjection.categories),
      repositoryCategoryTotal: total(plugins.main.categories),
      apiCategoryTotal: total(plugins.api.categories),
    },
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify(
      {
        output: relative(auditRoot, outputPath),
        generatedAt,
        tui: {
          available: appServer.tuiProjection.total,
        },
        cli: cli.localSnapshot.total,
        repository: plugins.main.total,
        ptyMatched: snapshot.ptyObservation.matchesProjection,
      },
      null,
      2,
    )}\n`,
  );
}

await main();
