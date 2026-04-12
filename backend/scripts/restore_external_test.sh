#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 /percorso/backup.archive.gz" >&2
  exit 1
fi

ARCHIVE_FILE="$1"
if [[ ! -f "$ARCHIVE_FILE" ]]; then
  echo "[restore-test] Archive non trovato: $ARCHIVE_FILE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

DB_NAME="${DB_NAME:-cyber_point}"
TEST_DB="${TEST_DB:-cyber_point_restore_test}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[restore-test] ENV file non trovato: $ENV_FILE" >&2
  exit 1
fi

MONGODB_URI="$(grep '^MONGODB_URI=' "$ENV_FILE" | cut -d= -f2- || true)"
if [[ -z "$MONGODB_URI" ]]; then
  echo "[restore-test] MONGODB_URI mancante in $ENV_FILE" >&2
  exit 1
fi

echo "[restore-test] Ripristino su DB di test: $TEST_DB"
mongorestore \
  --uri="$MONGODB_URI" \
  --archive="$ARCHIVE_FILE" \
  --gzip \
  --nsFrom="${DB_NAME}.*" \
  --nsTo="${TEST_DB}.*" \
  --drop

echo "[restore-test] Verifica conteggi"
mongosh --quiet "$MONGODB_URI" --eval "
const d = db.getSiblingDB('$TEST_DB');
print('users=' + d.users.countDocuments());
print('news=' + d.news.countDocuments());
print('decks=' + d.decks.countDocuments());
print('messages=' + d.messages.countDocuments());
print('cards=' + d.cards.countDocuments());
"

echo "[restore-test] Completato"