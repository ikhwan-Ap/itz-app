#!/bin/bash
# MongoDB Backup Script untuk itz-app
# Setup: chmod +x mongodb_backup.sh
# Cron (backup harian jam 02:00): 0 2 * * * /var/www/itz-app/scripts/mongodb_backup.sh
# Cron (backup mingguan Minggu jam 03:00): 0 3 * * 0 /var/www/itz-app/scripts/mongodb_backup.sh >> /var/log/mongodb_backup.log 2>&1

set -e

# ===== CONFIG =====
DB_NAME="${DB_NAME:-itz_app}"
BACKUP_DIR="/var/backups/mongodb"
RETENTION_DAYS=7          # Hapus backup lebih dari 7 hari
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/$DB_NAME/$DATE"

# ===== BACKUP =====
echo "[$(date)] Starting MongoDB backup: $DB_NAME → $BACKUP_PATH"

mkdir -p "$BACKUP_PATH"

mongodump \
    --db "$DB_NAME" \
    --out "$BACKUP_PATH" \
    --quiet

# Compress
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR/$DB_NAME" "$DATE"
rm -rf "$BACKUP_PATH"

echo "[$(date)] Backup selesai: $BACKUP_PATH.tar.gz ($(du -sh "$BACKUP_PATH.tar.gz" | cut -f1))"

# ===== CLEANUP — hapus backup lama =====
find "$BACKUP_DIR/$DB_NAME" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Cleanup: hapus backup > $RETENTION_DAYS hari"

echo "[$(date)] Done."
