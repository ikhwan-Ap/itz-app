#!/bin/bash
# MODE NORMAL — kembalikan endpoint /status ke perilaku asli platform
# is_task_running hanya true saat ada AI agent task berjalan
# Jalankan: bash /app/mode_normal.sh

AGENT_SERVER="/opt/plugins-venv/lib/python3.11/site-packages/plugins/tools/agent/server.py"
BACKUP="${AGENT_SERVER}.bak"
MODE_FILE="/app/.active_mode"

if [ ! -f "$BACKUP" ]; then
    echo "ERROR: File backup tidak ditemukan di $BACKUP"
    echo "Tidak bisa restore ke mode normal."
    exit 1
fi

python3 - <<'PYEOF'
import re

path = "/opt/plugins-venv/lib/python3.11/site-packages/plugins/tools/agent/server.py"
backup = path + ".bak"

with open(backup) as f:
    original = f.read()

with open(path) as f:
    current = f.read()

pattern = re.compile(
    r'(@app\.get\("/status"\)\nasync def get_status\(\):\n(?:    [^\n]*\n)+?)(?=\n@app\.|\nif __name__)',
    re.MULTILINE
)

# Ambil blok /status dari file backup (original)
match = pattern.search(original)
if not match:
    print("ERROR: Blok /status tidak ditemukan di file backup.")
    exit(1)

original_block = match.group(1)

new_content, n = pattern.subn(original_block, current, count=1)

if n == 0:
    print("ERROR: Blok /status tidak ditemukan di file aktif.")
    exit(1)

if new_content == current:
    print("Sudah dalam mode normal (tidak ada perubahan).")
    exit(0)

with open(path, "w") as f:
    f.write(new_content)

print("Berhasil: endpoint /status dikembalikan ke perilaku asli.")
PYEOF

[ $? -ne 0 ] && exit 1

echo "normal" > "$MODE_FILE"

PID=$(pgrep -f "agent.server:app" 2>/dev/null)
if [ -n "$PID" ]; then
    kill "$PID"
    echo "e1_agent di-restart..."
    sleep 5
fi

STATUS=$(curl -s http://localhost:8010/status 2>/dev/null)
echo "Mode aktif : NORMAL (perilaku asli platform)"
echo "Status saat ini : $STATUS"
echo ""
echo "PERINGATAN: Server sekarang bisa sleep kembali saat tidak ada task AI aktif."
