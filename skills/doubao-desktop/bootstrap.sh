#!/usr/bin/env bash
# Bootstrap for the doubao-desktop Agent skill.
# Installs the CLI (+ optional service) from GitHub, then self-checks.
#
#   bash bootstrap.sh            # CLI only
#   bash bootstrap.sh --service  # + launchd MCP service
set -euo pipefail
URL="https://raw.githubusercontent.com/JimmyWangJimmy/doubao-remote/main/install.sh"
echo "→ fetching installer from $URL"
curl -fsSL "$URL" | bash -s -- "$@"
