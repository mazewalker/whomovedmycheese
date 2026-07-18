#!/usr/bin/env bash
# Serve this static site (index.html, game.js, styles.css) locally so it can be
# reached through VSCode's "Ports" panel (Remote-SSH / Codespaces / devcontainer
# port forwarding). Run it, then forward the printed port from the Ports tab
# and open the forwarded URL.

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

is_port_in_use() {
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && exec 3<&- 3>&-
}

if [ -n "${1:-}" ]; then
    PORT="$1"
else
    PORT=8080
    while is_port_in_use "$PORT"; do
        PORT=$((PORT + 1))
    done
fi

if is_port_in_use "$PORT"; then
    echo "Port $PORT is already in use. Pass a different port, e.g.: ./serve.sh 8090" >&2
    exit 1
fi

echo "Serving $DIR on http://0.0.0.0:$PORT (open via VSCode's Ports tab)"
cd "$DIR"
exec python3 -m http.server "$PORT" --bind 0.0.0.0
