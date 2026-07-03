#!/bin/bash
set -euo pipefail

echo "=== [1/5] 系统更新 ==="
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq

echo "=== [2/5] 安装 MongoDB 7.0 ==="
if ! command -v mongod >/dev/null 2>&1; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list > /dev/null
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mongodb-org
else
  echo "MongoDB 已存在，跳过"
fi
sudo systemctl enable mongod
sudo systemctl start mongod
sleep 2
sudo systemctl is-active mongod

echo "=== [3/5] 安装 Nginx + Certbot ==="
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl is-active nginx

echo "=== [4/5] 安装 pnpm + PM2 ==="
if ! command -v pnpm >/dev/null 2>&1; then
  sudo npm install -g pnpm pm2
else
  sudo npm install -g pm2
fi

echo "=== [5/5] 防火墙：开放 80/443 ==="
if ! sudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
fi
if ! sudo iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null; then
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
fi
if ! dpkg -l iptables-persistent 2>/dev/null | grep -q ^ii; then
  echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
  echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables-persistent
fi
sudo netfilter-persistent save 2>/dev/null || true

echo "=== 创建应用目录 ==="
sudo mkdir -p /var/www
sudo chown ubuntu:ubuntu /var/www

echo "=== 全部安装完成 ==="
