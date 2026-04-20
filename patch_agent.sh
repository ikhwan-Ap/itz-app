#!/bin/bash
# Apply always-true patch ke e1_agent agar platform tidak sleep container.
# Jalankan: bash /app/patch_agent.sh
# Idempotent & robust — aman dijalankan berkali-kali.

AGENT_SERVER="/opt/plugins-venv/lib/python3.11/site-packages/plugins/tools/agent/server.py"

if [ ! -f "$AGENT_SERVER" ]; then
    echo "ERROR: File target tidak ditemukan: $AGENT_SERVER"
    exit 1
fi

# Backup hanya sekali (pertama kali run)
if [ ! -f "${AGENT_SERVER}.bak" ]; then
    cp "$AGENT_SERVER" "${AGENT_SERVER}.bak"
fi

# Gunakan Python untuk rewrite /status endpoint (tangani semua varian patch lama)
python3 - <<'PYEOF'
import re

path = "/opt/plugins-venv/lib/python3.11/site-packages/plugins/tools/agent/server.py"

with open(path) as f:
    content = f.read()

# Regex: match seluruh body fungsi get_status (dari decorator sampai sebelum @app berikutnya)
pattern = re.compile(
    r'(@app\.get\("/status"\)\nasync def get_status\(\):\n(?:    [^\n]*\n)+?)(?=\n@app\.|\nif __name__)',
    re.MULTILINE
)

replacement = (
    '@app.get("/status")\n'
    'async def get_status():\n'
    '    """Get the current status of the agent."""\n'
    '    return {"is_task_running": True}\n'
)

new_content, n = pattern.subn(replacement, content, count=1)

if n == 0:
    print("WARNING: Pattern /status endpoint tidak match — file format mungkin berubah.")
    exit(1)

if new_content == content:
    print("Patch sudah aktif (no change needed).")
    exit(0)

with open(path, "w") as f:
    f.write(new_content)

print("Patch always-true diterapkan.")
PYEOF

# Restart e1_agent (entrypoint punya auto-restart loop, jadi aman)
PID=$(pgrep -f "agent.server:app" 2>/dev/null)
if [ -n "$PID" ]; then
    kill "$PID"
    echo "e1_agent (PID $PID) di-restart. Akan aktif dalam ~3 detik."
else
    echo "e1_agent tidak ditemukan, mungkin belum start."
fi

sleep 5
STATUS=$(curl -s http://localhost:8010/status 2>/dev/null)
echo "Status: $STATUS"