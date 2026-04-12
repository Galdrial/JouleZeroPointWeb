#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-$HOME/mongo-backups}"
LATEST_BACKUP="$(ls -1t "$BACKUP_DIR"/cyber_point_*.archive.gz 2>/dev/null | head -n 1 || true)"

if [[ -z "$LATEST_BACKUP" ]]; then
  echo "[restore-test-latest] Nessun backup trovato in $BACKUP_DIR" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/restore_external_test.sh" "$LATEST_BACKUP"