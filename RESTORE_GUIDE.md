# MongoDB Restore Guide — ITZ-App

> **Penting:** Restore akan menimpa data yang ada. Lakukan hanya jika benar-benar diperlukan.  
> **Backup location:** `/var/backups/mongodb/`  
> **Backup format:** `itz_app_YYYYMMDD_HHMMSS.tar.gz`

---

## 1. Cek Backup Tersedia

```bash
ls -lh /var/backups/mongodb/
# Contoh output:
# -rw-r--r-- 1 root root 2.1M 2026-05-11 02:00 itz_app_20260511_020001.tar.gz
# -rw-r--r-- 1 root root 2.0M 2026-05-10 02:00 itz_app_20260510_020001.tar.gz
```

---

## 2. Extract Backup

```bash
# Pilih file backup yang ingin di-restore
BACKUP_FILE="itz_app_20260511_020001.tar.gz"

# Extract ke /tmp
tar -xzf /var/backups/mongodb/$BACKUP_FILE -C /tmp/

# Cek isi
ls /tmp/itz_app_20260511_020001/
```

---

## 3. Restore ke MongoDB

### Option A — Restore penuh (timpa semua data)

```bash
# HATI-HATI: ini akan menimpa semua data yang ada
mongorestore --db itz_app --drop /tmp/itz_app_20260511_020001/itz_app/
```

### Option B — Restore collection tertentu saja

```bash
# Contoh: restore hanya collection users
mongorestore --db itz_app --collection users --drop \
  /tmp/itz_app_20260511_020001/itz_app/users.bson
```

### Option C — Restore ke database sementara (aman untuk cek data)

```bash
# Restore ke DB sementara untuk inspeksi
mongorestore --db itz_app_restore /tmp/itz_app_20260511_020001/itz_app/

# Cek data di DB sementara
mongosh itz_app_restore --eval "db.users.countDocuments()"

# Jika OK, drop DB sementara
mongosh --eval "db.getSiblingDB('itz_app_restore').dropDatabase()"
```

---

## 4. Verifikasi Setelah Restore

```bash
# Cek jumlah dokumen per collection
mongosh itz_app --eval "
  ['users','packages','promos','transactions','notifications'].forEach(c => {
    print(c + ': ' + db[c].countDocuments())
  })
"

# Restart backend setelah restore
systemctl restart itz-backend

# Test API
curl https://indotimezone.store/api/health/db
```

---

## 5. Cleanup

```bash
# Hapus file extract sementara
rm -rf /tmp/itz_app_20260511_020001/
```

---

## 6. Manual Backup (jika perlu backup sekarang)

```bash
# Jalankan backup manual
/var/www/itz-app/backup_mongo.sh

# Atau dengan log
/var/www/itz-app/backup_mongo.sh >> /var/log/mongo_backup.log 2>&1
```

---

## 7. Cek Log Backup

```bash
# Lihat log backup terakhir
tail -50 /var/log/mongo_backup.log

# Cek cron job aktif
crontab -l | grep backup
```

---

*Dokumen ini adalah panduan restore untuk ITZ-App. Update jika ada perubahan struktur backup.*
