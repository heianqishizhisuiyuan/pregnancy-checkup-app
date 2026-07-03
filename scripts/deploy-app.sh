#!/bin/bash
# 部署产检记录应用到 19999 端口（HTTPS）
# 用法：
#   bash scripts/deploy-app.sh          # 日常快速部署（默认）
#   bash scripts/deploy-app.sh --fast   # 同上，跳过 Nginx / 防火墙
#   bash scripts/deploy-app.sh --full   # 完整部署（含 Nginx / 防火墙）
set -euo pipefail

APP_DIR="/var/www/pregnancy-checkup-app"
DOMAIN="heianqishizhisuiyuan.duckdns.org"
API_URL="https://${DOMAIN}:19999/api"
FRONTEND_URL="https://${DOMAIN}:19999"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

MODE="fast"
for arg in "$@"; do
  case "$arg" in
    --full) MODE="full" ;;
    --fast) MODE="fast" ;;
  esac
done

step=1
total=6
if [ "$MODE" = "fast" ]; then
  total=4
fi

if [ "$MODE" = "full" ]; then
  echo "=== [$step/$total] 开放防火墙 19999 端口 ==="
  if ! sudo iptables -C INPUT -p tcp --dport 19999 -j ACCEPT 2>/dev/null; then
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 19999 -j ACCEPT
  fi
  sudo netfilter-persistent save 2>/dev/null || true
  step=$((step + 1))

  echo "=== [$step/$total] 配置 Nginx ==="
  sudo cp "${SCRIPT_DIR}/nginx-pregnancy-19999.conf" /etc/nginx/sites-available/pregnancy-19999
  sudo ln -sf /etc/nginx/sites-available/pregnancy-19999 /etc/nginx/sites-enabled/pregnancy-19999
  sudo nginx -t
  sudo systemctl reload nginx
  step=$((step + 1))
else
  echo "=== 快速部署模式（跳过防火墙 / Nginx）==="
fi

echo "=== [$step/$total] 安装后端依赖 ==="
cd "${APP_DIR}/backend"
pnpm install --prod
step=$((step + 1))

echo "=== [$step/$total] 配置后端环境变量 ==="
if [ ! -f .env ]; then
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  cat > .env <<EOF
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/pregnancy-record
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=${FRONTEND_URL}
EOF
  echo "已创建 .env（含随机 JWT_SECRET）"
else
  if grep -q '^FRONTEND_URL=' .env; then
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${FRONTEND_URL}|" .env
  else
    echo "FRONTEND_URL=${FRONTEND_URL}" >> .env
  fi
  sed -i 's|^NODE_ENV=.*|NODE_ENV=production|' .env
  echo "已更新 .env"
fi

mkdir -p uploads
step=$((step + 1))

echo "=== [$step/$total] 构建前端 ==="
cd "${APP_DIR}/frontend"
pnpm install --ignore-scripts
echo "VITE_API_BASE_URL=${API_URL}" > .env.production
# 直接调用 vite，避免 pnpm 10+ 对 build scripts 审批导致 pnpm build 失败
node ./node_modules/vite/bin/vite.js build
step=$((step + 1))

echo "=== [$step/$total] 重启后端（PM2） ==="
cd "${APP_DIR}/backend"
if pm2 describe pregnancy-api >/dev/null 2>&1; then
  pm2 restart pregnancy-api
else
  pm2 start server.js --name pregnancy-api
fi
pm2 save

echo ""
echo "✅ 部署完成！"
echo "   访问地址: ${FRONTEND_URL}"
echo "   健康检查: ${FRONTEND_URL}/health"
