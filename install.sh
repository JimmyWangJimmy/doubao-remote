#!/usr/bin/env bash
# doubao-remote installer — puts the CLI on PATH, optionally starts the MCP
# server as a background service and installs the Agent skill.
#
#   bash install.sh              # CLI only
#   bash install.sh --service    # + MCP server on 127.0.0.1:18812 at login
#   bash install.sh --skill      # + copy the skill into ~/.agents/skills
#   bash install.sh --all        # everything
#
# Works both from a checkout and via: curl -fsSL <raw install.sh> | bash
# On Windows (Git Bash / MSYS / Cygwin) this script hands over to install.ps1,
# or tells you the PowerShell one-liner when PowerShell isn't reachable.
set -euo pipefail

REPO_URL="https://github.com/JimmyWangJimmy/doubao-remote.git"
INSTALL_DIR="${DOUBAO_MCP_HOME:-$HOME/.local/share/doubao-remote}"
BIN_DIR="${DOUBAO_BIN_DIR:-$HOME/.local/bin}"
SKILL_DIR="${DOUBAO_SKILL_DIR:-$HOME/.agents/skills}"
MCP_PORT="${DOUBAO_DESKTOP_PORT:-18812}"
CDP_PORT="${CDP_PORT:-9333}"

DO_SERVICE=0; DO_SKILL=0
for arg in "$@"; do
  case "$arg" in
    --service) DO_SERVICE=1 ;;
    --skill) DO_SKILL=1 ;;
    --all) DO_SERVICE=1; DO_SKILL=1 ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown flag: $arg"; exit 1 ;;
  esac
done

say() { printf '\033[36m▸\033[0m %s\n' "$*"; }
warn() { printf '\033[33m!\033[0m %s\n' "$*"; }

# ---------- platform dispatch: this is the shared entry point, Windows hands over to install.ps1
case "$(uname -s 2>/dev/null || echo unknown)" in
  MINGW*|MSYS*|CYGWIN*)
    PS_ARGS=()
    for arg in "$@"; do
      case "$arg" in
        --skill)   PS_ARGS+=("-Skill") ;;
        --service) PS_ARGS+=("-Service") ;;
        --all)     PS_ARGS+=("-All") ;;
        *)         PS_ARGS+=("$arg") ;;
      esac
    done
    HERE="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
    PS1="$HERE/install.ps1"
    if [ -n "$HERE" ] && [ -f "$PS1" ]; then
      command -v cygpath >/dev/null 2>&1 && PS1="$(cygpath -w "$PS1" 2>/dev/null || printf '%s' "$PS1")"
      say "Windows detected — handing over to PowerShell"
      if command -v powershell.exe >/dev/null 2>&1; then
        exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS1" ${PS_ARGS+"${PS_ARGS[@]}"}
      elif command -v powershell >/dev/null 2>&1; then
        exec powershell -NoProfile -ExecutionPolicy Bypass -File "$PS1" ${PS_ARGS+"${PS_ARGS[@]}"}
      fi
    fi
    warn "Windows detected, but PowerShell isn't reachable from this shell."
    printf '  Run this in PowerShell instead:\n    irm https://raw.githubusercontent.com/JimmyWangJimmy/doubao-remote/main/install.ps1 | iex\n'
    exit 1
    ;;
esac

# ---------- 0. sanity
command -v node >/dev/null || { echo "node >= 21 is required"; exit 1; }
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 21 ] || { echo "node >= 21 is required, found $(node -v)"; exit 1; }
[ "$(uname -s)" = "Darwin" ] || warn "not macOS — the CLI installs fine, but launching Doubao relies on 'open -a'; run 'doubao ensure' yourself after starting the app"

# ---------- 1. source
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
if [ -n "$SELF_DIR" ] && [ -f "$SELF_DIR/src/server.js" ]; then
  SRC="$SELF_DIR"
  say "using the existing checkout: $SRC"
else
  if [ -d "$INSTALL_DIR/.git" ]; then
    say "updating $INSTALL_DIR"
    git -C "$INSTALL_DIR" pull --ff-only --quiet 2>/dev/null || warn "pull failed, using the local copy"
  else
    say "cloning into $INSTALL_DIR"
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone --depth 1 --quiet "$REPO_URL" "$INSTALL_DIR"
  fi
  SRC="$INSTALL_DIR"
fi

# ---------- 2. CLI
mkdir -p "$BIN_DIR"
cat > "$BIN_DIR/doubao" <<EOF
#!/bin/sh
exec /usr/bin/env node "$SRC/bin/doubao.js" "\$@"
EOF
chmod +x "$BIN_DIR/doubao"
say "installed CLI: $BIN_DIR/doubao"
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) warn "$BIN_DIR is not on PATH — add: export PATH=\"$BIN_DIR:\$PATH\"" ;;
esac

# ---------- 3. make the app reachable over devtools
if ! curl -fsS -m 2 "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null 2>&1; then
  say "starting Doubao with --remote-debugging-port=$CDP_PORT"
  open -a Doubao --args --remote-debugging-port="$CDP_PORT" 2>/dev/null || warn "could not open Doubao; start it manually"
  for _ in $(seq 1 20); do
    sleep 1
    curl -fsS -m 2 "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null 2>&1 && break
  done
fi
if curl -fsS -m 2 "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null 2>&1; then
  say "devtools OK on $CDP_PORT"
else
  warn "devtools not reachable — run: open -a Doubao --args --remote-debugging-port=$CDP_PORT"
fi

# ---------- 4. skill
if [ "$DO_SKILL" = 1 ]; then
  mkdir -p "$SKILL_DIR"
  rm -rf "$SKILL_DIR/doubao-desktop"
  cp -R "$SRC/skills/doubao-desktop" "$SKILL_DIR/doubao-desktop"
  say "skill installed: $SKILL_DIR/doubao-desktop"
fi

# ---------- 5. service
if [ "$DO_SERVICE" = 1 ]; then
  PLIST="$HOME/Library/LaunchAgents/com.jimmy.doubao-remote.plist"
  mkdir -p "$SRC/var"
  sed "s#__REPO__#$SRC#g" "$SRC/launchd/com.jimmy.doubao-remote.plist" > "$PLIST"
  launchctl bootout "gui/$(id -u)/com.jimmy.doubao-remote" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST"
  say "launchd service loaded (port $MCP_PORT)"
fi

# ---------- 6. verify
echo
if node "$SRC/bin/doubao.js" status 2>/dev/null | grep -q '"ok": true'; then
  say "self-check: app reachable"
else
  warn "self-check failed — open Doubao once, then: doubao status"
fi

cat <<EOF

Done.

  CLI      : doubao status | doubao ask "…" | doubao list
  MCP      : http://127.0.0.1:$MCP_PORT/mcp   (streamable-http)
  App      : open -a Doubao --args --remote-debugging-port=$CDP_PORT
  Skill    : ${SKILL_DIR}/doubao-desktop  (run with --skill)
  Service  : ~/Library/LaunchAgents/com.jimmy.doubao-remote.plist  (run with --service)
EOF
