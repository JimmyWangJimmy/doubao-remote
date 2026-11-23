<#
.SYNOPSIS
  doubao-remote installer for Windows - the PowerShell counterpart of install.sh.

.DESCRIPTION
  Puts the `doubao` CLI on PATH, relaunches Doubao with a devtools port, then self-checks.
  Mirrors install.sh, whose macOS-only steps (open -a / launchd / launchctl) are replaced by
  Start-Process-family helpers, a .cmd shim and a logon scheduled task.

.PARAMETER Skill
  Also copy the Agent skill into %USERPROFILE%\.agents\skills\doubao-desktop.

.PARAMETER Service
  Also register a logon scheduled task that keeps the MCP server on 127.0.0.1:18812.

.PARAMETER All
  Both of the above.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File install.ps1
  powershell -ExecutionPolicy Bypass -File install.ps1 -All
#>
[CmdletBinding()]
param(
  [switch]$Skill,
  [switch]$Service,
  [switch]$All,
  [string]$RepoUrl = 'https://github.com/JimmyWangJimmy/doubao-remote.git',
  [int]$CdpPort = 9333,
  [int]$McpPort = 18812
)

# Native tools (git, node, schtasks) write progress to stderr; judge them by exit code instead,
# so 'Stop' is only used for real PowerShell failures.
$ErrorActionPreference = 'Continue'
if ($All) { $Skill = $true; $Service = $true }

$InstallDir = if ($env:DOUBAO_MCP_HOME) { $env:DOUBAO_MCP_HOME } else { Join-Path $env:USERPROFILE '.local\share\doubao-remote' }
$BinDir     = if ($env:DOUBAO_BIN_DIR)  { $env:DOUBAO_BIN_DIR }  else { Join-Path $env:USERPROFILE '.local\bin' }
$SkillDir   = if ($env:DOUBAO_SKILL_DIR){ $env:DOUBAO_SKILL_DIR }else { Join-Path $env:USERPROFILE '.agents\skills' }
$TaskName   = 'doubao-remote-mcp'

function Say([string]$m)  { Write-Host "  > $m" -ForegroundColor Cyan }
function Warn([string]$m) { Write-Host "  ! $m" -ForegroundColor Yellow }

# ---------- platform guard: this file is the Windows half of the installer
$onWindows = if (Get-Variable -Name IsWindows -ErrorAction SilentlyContinue) { $IsWindows } else { $env:OS -eq 'Windows_NT' }
if (-not $onWindows) {
  Warn 'this installer targets Windows; on macOS / Linux run install.sh instead:'
  Write-Host '    curl -fsSL https://raw.githubusercontent.com/JimmyWangJimmy/doubao-remote/main/install.sh | bash'
  return
}

# ---------- 0. Node >= 21 (= the "command -v node" check in install.sh)
$node = $env:DOUBAO_NODE
if (-not $node) {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { $node = $cmd.Source }
}
if (-not $node) {
  foreach ($p in @(
      (Join-Path $env:LOCALAPPDATA 'Programs\nodejs\node.exe'),
      (Join-Path $env:ProgramFiles 'nodejs\node.exe'),
      (Join-Path ${env:ProgramFiles(x86)} 'nodejs\node.exe'),
      (Join-Path $env:APPDATA 'nvm\node.exe'),
      (Join-Path $env:LOCALAPPDATA 'Volta\node.exe'),
      (Join-Path $env:LOCALAPPDATA 'fnm_multishells\node.exe'))) {
    if ($p -and (Test-Path $p)) { $node = $p; break }
  }
}
# MSI / winget installs record their directory in the registry - covers non-default drive layouts.
if (-not $node) {
  foreach ($key in @('HKLM:\SOFTWARE\Node.js', 'HKCU:\SOFTWARE\Node.js')) {
    $ip = (Get-ItemProperty -Path $key -ErrorAction SilentlyContinue).InstallPath
    if ($ip) {
      $cand = Join-Path $ip 'node.exe'
      if (Test-Path $cand) { $node = $cand; break }
    }
  }
}
if (-not $node) {
  throw @'
node >= 21 is required but was not found.
  - Install it:  winget install OpenJS.NodeJS.LTS
  - Just installed it? Open a NEW terminal so PATH refreshes, then re-run this installer.
  - Node on a custom drive? Set DOUBAO_NODE to the full path, e.g.
      $env:DOUBAO_NODE = 'D:\Tools\nodejs\node.exe'
'@
}
$nodeVersion = (& $node -v).Trim()
$major = [int](($nodeVersion.TrimStart('v').Split('.'))[0])
if ($major -lt 21) { throw "node >= 21 is required, found $nodeVersion" }
Say "node: $node ($nodeVersion)"

# ---------- 1. source (= step 1 of install.sh; a checkout next to this script wins)
# Empty when piped through `irm ... | iex`, so guard every use of it.
$selfDir = if ($MyInvocation.MyCommand.Path) { Split-Path -Parent $MyInvocation.MyCommand.Path } else { '' }
if ($selfDir -and (Test-Path (Join-Path $selfDir 'src\server.js'))) {
  $src = $selfDir
  Say "using the existing checkout: $src"
} elseif (Test-Path (Join-Path $InstallDir 'src\server.js')) {
  $src = $InstallDir
  Say "using $src"
} else {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'git is required to clone the source, or run this script from a checkout' }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $InstallDir) | Out-Null
  Say "cloning into $InstallDir"
  & git clone --depth 1 $RepoUrl $InstallDir | Out-Host
  if ($LASTEXITCODE -ne 0) { throw 'git clone failed (network or proxy?)' }
  $src = $InstallDir
}

# ---------- 2. CLI (= the ~/.local/bin/doubao shell shim, as a .cmd)
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null
$cmdFile = Join-Path $BinDir 'doubao.cmd'
$shim = "@echo off`r`n`"$node`" `"$src\bin\doubao.js`" %*`r`n"
Set-Content -Path $cmdFile -Value $shim -Encoding ASCII -NoNewline
Say "installed CLI: $cmdFile"
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$parts = @($userPath -split ';' | Where-Object { $_ })
if ($parts -notcontains $BinDir) {
  [Environment]::SetEnvironmentVariable('Path', (($parts + $BinDir) -join ';'), 'User')
  Warn "$BinDir added to PATH - open a new terminal to pick it up"
}
$env:PATH = "$BinDir;$env:PATH"
$env:CDP_PORT = "$CdpPort"
$env:DOUBAO_DESKTOP_PORT = "$McpPort"

# ---------- 3. make the app reachable over devtools (= the `open -a Doubao --args` step)
$cdpUrl = "http://127.0.0.1:$CdpPort/json/version"
$reachable = $false
try { Invoke-WebRequest -Uri $cdpUrl -TimeoutSec 2 -UseBasicParsing | Out-Null; $reachable = $true } catch {}
if (-not $reachable) {
  Say "starting Doubao with --remote-debugging-port=$CdpPort"
  & $node (Join-Path $src 'bin\doubao.js') ensure | Out-Host
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 800
    try { Invoke-WebRequest -Uri $cdpUrl -TimeoutSec 2 -UseBasicParsing | Out-Null; $reachable = $true; break } catch {}
  }
}
if ($reachable) { Say "devtools OK on $CdpPort" } else { Warn "devtools not reachable - run: doubao ensure" }

# ---------- 4. skill
if ($Skill) {
  New-Item -ItemType Directory -Force -Path $SkillDir | Out-Null
  $dst = Join-Path $SkillDir 'doubao-desktop'
  if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
  Copy-Item -Recurse (Join-Path $src 'skills\doubao-desktop') $dst
  Say "skill installed: $dst"
}

# ---------- 5. service (= the launchd agent: logon task, or a Startup entry when not elevated)
if ($Service) {
  $server = Join-Path $src 'src\server.js'
  $action = '"' + $node + '" "' + $server + '"'
  $registered = $false

  # A logon task is the cleanest option but needs elevation; try it first.
  try { & schtasks /Create /TN $TaskName /TR $action /SC ONLOGON /RL LIMITED /F 2>&1 | Out-Null } catch {}
  if ($LASTEXITCODE -eq 0) {
    $registered = $true
    Say "scheduled task '$TaskName' created (MCP on port $McpPort, starts at logon)"
  }

  if (-not $registered) {
    # No admin rights: drop a windowless launcher into the per-user Startup folder.
    $startup = [Environment]::GetFolderPath('Startup')
    New-Item -ItemType Directory -Force -Path $startup | Out-Null
    $vbs = Join-Path $startup 'doubao-remote-mcp.vbs'
    $vbsBody = 'Set sh = CreateObject("WScript.Shell")' + "`r`n" +
               'sh.Run """' + $node + '"" ""' + $server + '""", 0, False' + "`r`n"
    Set-Content -Path $vbs -Value $vbsBody -Encoding ASCII
    Say "logon autostart installed (no admin needed): $vbs"
  }

  & $node (Join-Path $src 'bin\doubao.js') service start | Out-Host
}

# ---------- 6. verify (= the `doubao status | grep '"ok": true'` step)
Write-Host ''
$statusJson = (& $node (Join-Path $src 'bin\doubao.js') status) -join "`n"
$statusJson | Write-Host
if ($statusJson -match '"ok":\s*true') { Say 'self-check: app reachable' }
else { Warn 'self-check failed - open Doubao once, then run: doubao status' }

Write-Host @"

Done.

  CLI      : doubao status | doubao ask "..." | doubao list
  MCP      : http://127.0.0.1:$McpPort/mcp   (streamable-http, doubao service start)
  App      : doubao ensure   (relaunches Doubao with --remote-debugging-port=$CdpPort)
  Skill    : $SkillDir\doubao-desktop   (-Skill)
  Service  : scheduled task '$TaskName'  (-Service)
  Output   : $env:USERPROFILE\Pictures\doubao-desktop
"@

# Native commands above leave their own $LASTEXITCODE behind; report the installer's own result.
if ($statusJson -match '"ok":\s*true') { exit 0 } else { exit 1 }
