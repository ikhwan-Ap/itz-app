#!/bin/bash
# MODE 2: Always On — is_task_running selalu true, server tidak pernah sleep
# Jalankan: bash /app/mode_always_on.sh

AGENT_SERVER="/opt/plugins-venv/lib/python3.11/site-packages/plugins/tools/agent/server.py"
MODE_FILE="/app/.active_mode"

python3 - <<'PYEOF'
import re

path = "/opt/plugins-venv/lib/python3.11/site-packages/plugins/tools/agent/server.py"

with open(path) as f:
    content = f.read()

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
    print("ERROR: Pattern tidak ditemukan. Format file mungkin berubah.")
    exit(1)

if new_content == content:
    print("Mode always-on sudah aktif.")
    exit(0)

with open(path, "w") as f:
    f.write(new_content)

print("Berhasil: patch always-on diterapkan.")
PYEOF

[ $? -ne 0 ] && exit 1

echo "always_on" > "$MODE_FILE"

PID=$(pgrep -f "agent.server:app" 2>/dev/null)
if [ -n "$PID" ]; then
    kill "$PID"
    echo "e1_agent di-restart..."
    sleep 5
fi

STATUS=$(curl -s http://localhost:8010/status 2>/dev/null)
echo "Mode aktif : ALWAYS ON (server tidak pernah sleep)"
echo "Status saat ini : $STATUS"