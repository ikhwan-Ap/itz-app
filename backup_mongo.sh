#!/bin/bash
# MongoDB Backup Script untuk itz-app
# Jalankan via cron: 0 2 * * * /var/www/itz-app/backup_mongo.sh
# Backup setiap hari jam 02:00 UTC, simpan 7 hari terakhir

set -e

DB_NAME="itz_app"
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$DB_NAME_$DATE"
KEEP_DAYS=7

# Buat direktori backup jika belum ada
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting MongoDB backup: $DB_NAME"

# Dump database
mongodump --db "$DB_NAME" --out "$BACKUP_PATH" --quiet

# Compress
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "$(basename $BACKUP_PATH)"
rm -rf "$BACKUP_PATH"

echo "[$(date)] Backup selesai: $BACKUP_PATH.tar.gz ($(du -sh $BACKUP_PATH.tar.gz | cut -f1))"

# Hapus backup lebih dari KEEP_DAYS hari
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] Cleanup: hapus backup lebih dari $KEEP_DAYS hari"

echo "[$(date)] Done."
