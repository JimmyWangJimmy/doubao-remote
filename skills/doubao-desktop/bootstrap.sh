#!/usr/bin/env bash
# Bootstrap for the doubao-desktop Agent skill.
# Installs the CLI (+ optional service) from GitHub, then self-checks.
#
#   bash bootstrap.sh            # CLI only
#   bash bootstrap.sh --service  # + launchd MCP service
set -euo pipefail
URL="https://raw.githubusercontent.com/JimmyWangJimmy/doubao-remote/main/install.sh"
echo "→ fetching installer from $URL"
if curl -fsSL --max-time 20 "$URL" | bash -s -- "$@"; then
  exit 0
fi
echo "! raw.githubusercontent.com unreachable, falling back to git clone"
tmp="$(mktemp -d)"
git clone --depth 1 --quiet https://github.com/JimmyWangJimmy/doubao-remote.git "$tmp/doubao-remote"
bash "$tmp/doubao-remote/install.sh" "$@"
