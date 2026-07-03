#!/bin/bash
# 从 backup.sh 生成的 tar.gz 恢复数据（会覆盖当前库与 uploads，请先备份）
# 用法：
#   bash scripts/restore.sh /var/backups/pregnancy-checkup/backup_20260703_120000.tar.gz
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "用法: bash scripts/restore.sh <backup.tar.gz>"
  exit 1
fi

ARCHIVE="$1"
APP_DIR="${APP_DIR:-/var/www/pregnancy-checkup-app}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/pregnancy-record}"
RESTORE_ROOT="${RESTORE_ROOT:-/tmp/pregnancy-restore}"

if [ ! -f "${ARCHIVE}" ]; then
  echo "备份文件不存在: ${ARCHIVE}"
  exit 1
fi

rm -rf "${RESTORE_ROOT}"
mkdir -p "${RESTORE_ROOT}"
tar -xzf "${ARCHIVE}" -C "${RESTORE_ROOT}"

BACKUP_FOLDER="$(find "${RESTORE_ROOT}" -maxdepth 1 -type d -name 'backup_*' | head -1)"
if [ -z "${BACKUP_FOLDER}" ]; then
  echo "备份包格式无效"
  exit 1
fi

echo ">>> 恢复 MongoDB ..."
mongorestore --uri="${MONGODB_URI}" --drop "${BACKUP_FOLDER}/mongo/pregnancy-record"

UPLOADS_SRC="${BACKUP_FOLDER}/uploads"
UPLOADS_DST="${APP_DIR}/backend/uploads"
if [ -d "${UPLOADS_SRC}" ]; then
  echo ">>> 恢复 uploads ..."
  rm -rf "${UPLOADS_DST}"
  cp -a "${UPLOADS_SRC}" "${UPLOADS_DST}"
fi

rm -rf "${RESTORE_ROOT}"
echo "✅ 恢复完成，请重启后端服务（如 pm2 restart pregnancy-api）"
