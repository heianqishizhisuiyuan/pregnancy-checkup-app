# 一键部署：提交 → 推送 → 服务器拉取 → 构建重启
# 用法：
#   .\scripts\redeploy.ps1                    # 自动提交并部署（默认提交说明「部署更新」）
#   .\scripts\redeploy.ps1 "修复登录问题"      # 自定义提交说明
#   .\scripts\redeploy.ps1 -DeployOnly        # 跳过 git，仅重新部署（代码已 push 时）
#   .\scripts\redeploy.ps1 -Full              # 完整部署（含 Nginx / 防火墙配置）

param(
    [Parameter(Position = 0)]
    [string]$Message = "部署更新",
    [switch]$DeployOnly,
    [switch]$Full
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path $PSScriptRoot -Parent
$SSH_KEY  = "C:\Users\wangc\Desktop\ssh-key-2026-03-07.key"
$SERVER   = "ubuntu@149.118.151.158"
$BRANCH   = "master"
$APP_URL  = "https://heianqishizhisuiyuan.duckdns.org:19999"

function Write-Step($text) {
    Write-Host ""
    Write-Host ">>> $text" -ForegroundColor Cyan
}

if (-not (Test-Path $SSH_KEY)) {
    Write-Host "找不到 SSH 密钥: $SSH_KEY" -ForegroundColor Red
    exit 1
}

Set-Location $RepoRoot

if (-not $DeployOnly) {
    Write-Step "检查本地改动"
    $status = git status --porcelain
    if ($status) {
        git add -A
        # 不提交本地上传目录和敏感配置
        git reset HEAD backend/uploads/ 2>$null
        git reset HEAD backend/.env 2>$null
        git reset HEAD frontend/.env.local 2>$null

        $remaining = git status --porcelain
        if ($remaining) {
            Write-Host "待提交文件:" -ForegroundColor Yellow
            git status -s
            git commit -m $Message
        } else {
            Write-Host "无有效改动（已排除 uploads/.env），跳过提交" -ForegroundColor Yellow
        }
    } else {
        Write-Host "工作区干净，跳过提交" -ForegroundColor Yellow
    }

    Write-Step "推送到 GitHub ($BRANCH)"
    git push origin $BRANCH
}

$deployFlag = if ($Full) { "" } else { " --fast" }
$remoteCmd = "cd /var/www/pregnancy-checkup-app && git pull origin $BRANCH && bash scripts/deploy-app.sh$deployFlag"

Write-Step "服务器部署中..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER $remoteCmd

Write-Step "健康检查"
try {
    $health = curl.exe -sk "$APP_URL/health"
    Write-Host $health -ForegroundColor Green
} catch {
    Write-Host "健康检查失败，请手动访问 $APP_URL/health" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "部署完成: $APP_URL" -ForegroundColor Green
