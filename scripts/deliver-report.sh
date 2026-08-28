#!/usr/bin/env bash
set -euo pipefail

audit_root="$(cd "$(dirname "$0")/.." && pwd)"
plugins_checkout="${OPENAI_PLUGINS_REPO:-$audit_root/../openai/plugins}"
builder="$plugins_checkout/plugins/data-analytics/skills/build-report/scripts/deliver_portable_artifact.mjs"

if [[ ! -f "$builder" ]]; then
  echo "Data Analytics portable builder not found: $builder" >&2
  exit 1
fi

node "$audit_root/scripts/localize-artifact.mjs" \
  "$audit_root/artifact.json" \
  "$audit_root/i18n"

node "$builder" \
  --input "$audit_root/artifact.json" \
  --output "$audit_root/report.html"

for locale in zh ja ko; do
  node "$builder" \
    --input "$audit_root/i18n/artifact.$locale.json" \
    --output "$audit_root/report.$locale.html"
done

node "$audit_root/scripts/enhance-report.mjs" "$audit_root/report.html" en "$audit_root/data/snapshot.json"
node "$audit_root/scripts/enhance-report.mjs" "$audit_root/report.zh.html" zh "$audit_root/data/snapshot.json"
node "$audit_root/scripts/enhance-report.mjs" "$audit_root/report.ja.html" ja "$audit_root/data/snapshot.json"
node "$audit_root/scripts/enhance-report.mjs" "$audit_root/report.ko.html" ko "$audit_root/data/snapshot.json"
