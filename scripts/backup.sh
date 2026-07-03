#!/bin/bash
# 备份 MongoDB 数据库与 uploads 目录
# 用法：
#   bash scripts/backup.sh
#   APP_DIR=/var/www/pregnancy-checkup-app BACKUP_DIR=/var/backups/pregnancy bash scripts/backup.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/pregnancy-checkup-app}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/pregnancy-checkup}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/pregnancy-record}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
WORK_DIR="${BACKUP_DIR}/backup_${TIMESTAMP}"
ARCHIVE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}" "${WORK_DIR}"

echo ">>> 备份 MongoDB ..."
mongodump --uri="${MONGODB_URI}" --out="${WORK_DIR}/mongo"

UPLOADS_DIR="${APP_DIR}/backend/uploads"
if [ -d "${UPLOADS_DIR}" ]; then
  echo ">>> 备份 uploads ..."
  cp -a "${UPLOADS_DIR}" "${WORK_DIR}/uploads"
else
  echo ">>> 跳过 uploads（目录不存在: ${UPLOADS_DIR}）"
fi

echo ">>> 打包 ..."
tar -czf "${ARCHIVE}" -C "${BACKUP_DIR}" "backup_${TIMESTAMP}"
rm -rf "${WORK_DIR}"

echo "✅ 备份完成: ${ARCHIVE}"
