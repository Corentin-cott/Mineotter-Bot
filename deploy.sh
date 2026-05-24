#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

OTTERBOTS_SYNC="${OTTERBOTS_SYNC:-1}"
OTTERBOTS_REF="${OTTERBOTS_REF:-develop}"
OTTERBOTS_REPO="https://github.com/L-Antre-des-Loutres/Otterbots.git"

if [ "$OTTERBOTS_SYNC" = "1" ]; then
    echo "Syncing Otterbots framework (ref: $OTTERBOTS_REF)..."
    rm -rf .otterbots-tmp
    git clone --depth 1 -b "$OTTERBOTS_REF" "$OTTERBOTS_REPO" .otterbots-tmp
    rm -rf src/otterbots
    cp -R .otterbots-tmp/src/otterbots src/otterbots
    rm -rf .otterbots-tmp
else
    echo "OTTERBOTS_SYNC=0 -> using existing src/otterbots (no fetch)."
fi

if [ ! -f src/otterbots/index.ts ]; then
    echo "Error: src/otterbots/index.ts is missing. Run with OTTERBOTS_SYNC=1 to fetch the framework." >&2
    exit 1
fi

[ -f channels.json ]         || echo '{}' > channels.json
[ -f otterlyApiRoutes.json ] || echo '[]' > otterlyApiRoutes.json

if ! docker network inspect discord-bots-net >/dev/null 2>&1; then
    echo "Network 'discord-bots-net' not found. Start the docker-proxy compose first." >&2
    exit 1
fi

docker build --no-cache -t mineotter:latest .
docker compose up -d

docker compose logs --tail=50 mineotter
