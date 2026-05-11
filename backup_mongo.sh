#!/bin/bash
# MongoDB Backup Script untuk itz-app
# Jalankan via cron: 0 2 * * * /var/www/itz-app/backup_mongo.sh >> /var/log/mongo_backup.log 2>&1
# Backup setiap hari jam 02:00 UTC, simpan 7 hari terakhir

set -e

DB_NAME="${DB_NAME:-itz_app}"
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/${DB_NAME}_$DATE"
KEEP_DAYS=7
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

# Buat direktori backup jika belum ada
mkdir -p "$BACKUP_DIR"

echo "$LOG_PREFIX START backup: $DB_NAME"

# Dump database
mongodump --db "$DB_NAME" --out "$BACKUP_PATH" --quiet

# Compress
tar -czf "${BACKUP_PATH}.tar.gz" -C "$BACKUP_DIR" "$(basename $BACKUP_PATH)"
rm -rf "$BACKUP_PATH"

FILE_SIZE=$(du -sh "${BACKUP_PATH}.tar.gz" | cut -f1)
echo "$LOG_PREFIX DONE backup: ${BACKUP_PATH}.tar.gz ($FILE_SIZE)"

# Hapus backup lebih dari KEEP_DAYS hari
DELETED=$(find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -print -delete | wc -l)
echo "$LOG_PREFIX CLEANUP: $DELETED file(s) older than $KEEP_DAYS days removed"

echo "$LOG_PREFIX FINISHED"
