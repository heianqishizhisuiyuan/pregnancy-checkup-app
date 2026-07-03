# One-click deploy: commit -> push -> pull on server -> build & restart
# Usage:
#   .\scripts\redeploy.ps1
#   .\scripts\redeploy.ps1 "fix login issue"
#   .\scripts\redeploy.ps1 -DeployOnly
#   .\scripts\redeploy.ps1 -Full

param(
    [Parameter(Position = 0)]
    [string]$Message = "deploy update",
    [switch]$DeployOnly,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent
$SSH_KEY  = "C:\Users\wangc\Desktop\ssh-key-2026-03-07.key"
$SERVER   = "ubuntu@149.118.151.158"
$BRANCH   = "master"
$APP_URL  = "https://heianqishizhisuiyuan.duckdns.org:19999"

function Write-Step([string]$text) {
    Write-Host ""
    Write-Host ">>> $text" -ForegroundColor Cyan
}

if (-not (Test-Path $SSH_KEY)) {
    Write-Host "SSH key not found: $SSH_KEY" -ForegroundColor Red
    exit 1
}

Set-Location $RepoRoot

if (-not $DeployOnly) {
    Write-Step "check local changes"
    $status = git status --porcelain
    if ($status) {
        git add -A
        git reset HEAD backend/uploads/ 2>$null
        git reset HEAD backend/.env 2>$null
        git reset HEAD frontend/.env.local 2>$null

        $remaining = git status --porcelain
        if ($remaining) {
            Write-Host "files to commit:" -ForegroundColor Yellow
            git status -s
            git commit -m $Message
        } else {
            Write-Host "no valid changes, skip commit" -ForegroundColor Yellow
        }
    } else {
        Write-Host "working tree clean, skip commit" -ForegroundColor Yellow
    }

    Write-Step "push to GitHub ($BRANCH)"
    git push origin $BRANCH
}

$deployFlag = if ($Full) { "" } else { " --fast" }
$remoteCmd = "cd /var/www/pregnancy-checkup-app && git pull origin $BRANCH && bash scripts/deploy-app.sh$deployFlag"

Write-Step "deploy on server"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER $remoteCmd

Write-Step "health check"
$healthUrl = "$APP_URL/health"
try {
    $health = curl.exe -sk $healthUrl
    Write-Host $health -ForegroundColor Green
} catch {
    Write-Host "health check failed: $healthUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "done: $APP_URL" -ForegroundColor Green
