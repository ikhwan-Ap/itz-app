#!/bin/bash
# Cek status mode yang sedang aktif
# Jalankan: bash /app/mode_status.sh

AGENT_SERVER="/opt/plugins-venv/lib/python3.11/site-packages/plugins/tools/agent/server.py"
MODE_FILE="/app/.active_mode"

echo "========================================="
echo "  SERVER SLEEP PREVENTION — STATUS CHECK"
echo "========================================="

# 1. Deteksi mode dari file agent server
if [ ! -f "$AGENT_SERVER" ]; then
    echo "PATCH  : ERROR — file target tidak ditemukan"
else
    if grep -q "_cycle" "$AGENT_SERVER" 2>/dev/null; then
        DETECTED="stealth"
    elif grep -q 'return {"is_task_running": True}' "$AGENT_SERVER" 2>/dev/null; then
        DETECTED="always_on"
    else
        DETECTED="original (patch tidak aktif)"
    fi
    echo "PATCH  : $DETECTED"
fi

# 2. Mode tersimpan di config
if [ -f "$MODE_FILE" ]; then
    SAVED=$(cat "$MODE_FILE")
    echo "CONFIG : $SAVED"
else
    echo "CONFIG : (belum pernah diset lewat script)"
fi

# 3. Status live dari endpoint
STATUS=$(curl -s http://localhost:8010/status 2>/dev/null)
if [ -n "$STATUS" ]; then
    echo "LIVE   : $STATUS"
else
    echo "LIVE   : (endpoint tidak merespons — e1_agent mungkin sedang restart)"
fi

# 4. Proses
PID=$(pgrep -f "agent.server:app" 2>/dev/null)
if [ -n "$PID" ]; then
    echo "PID    : e1_agent berjalan (PID $PID)"
else
    echo "PID    : e1_agent tidak ditemukan"
fi

# 5. Monitor heartbeat terakhir
LAST_HB=$(tail -3 /var/log/monitor.log 2>/dev/null | grep "Heartbeat sent" | tail -1)
if [ -n "$LAST_HB" ]; then
    echo "HB     : $LAST_HB"
else
    echo "HB     : (log tidak tersedia)"
fi

echo "========================================="
echo ""
echo "Perintah tersedia:"
echo "  bash /app/patch_agent.sh    → aktifkan patch is_task_running"
echo "  bash /app/mode_always_on.sh  → always on (server tidak pernah sleep)"
echo "  bash /app/mode_stealth.sh    → stealth (sleep ~7 mnt tiap 90 mnt)"
echo "  bash /app/mode_normal.sh     → normal (perilaku asli platform, bisa sleep)"
echo "  bash /app/mode_status.sh     → cek status ini"

