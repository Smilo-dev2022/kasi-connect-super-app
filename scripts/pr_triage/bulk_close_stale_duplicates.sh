#!/usr/bin/env bash
set -euo pipefail

CUTOFF="2025-09-17T00:00:00Z"
SUMMARY_JSON="pr_triage/summary.json"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found" >&2
  exit 1
fi

jq -r .stale_duplicates[].number "$SUMMARY_JSON" | while read -r pr; do
  merged_list=$(jq -r ".stale_duplicates[] | select(.number == $pr) | .merged_matches | map("\"#\(. )\"") | join(", ")" "$SUMMARY_JSON")
  body=$(cat <<EOF
Closing as stale duplicate. This PR appears to duplicate functionality already landed in PR(s) ${merged_list}.

It has been open for over 30 days, so were
