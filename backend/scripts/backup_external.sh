#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

read_env_var() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | head -n 1 | cut -d= -f2- || true
}

DB_NAME="${DB_NAME:-cyber_point}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/mongo-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-21}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[backup] ENV file non trovato: $ENV_FILE" >&2
  exit 1
fi

MONGODB_URI="$(read_env_var MONGODB_URI)"
if [[ -z "$MONGODB_URI" ]]; then
  echo "[backup] MONGODB_URI mancante in $ENV_FILE" >&2
  exit 1
fi

OFFSITE_REMOTE="${OFFSITE_REMOTE:-$(read_env_var OFFSITE_REMOTE)}"
OFFSITE_PATH="${OFFSITE_PATH:-$(read_env_var OFFSITE_PATH)}"
OFFSITE_RETENTION_DAYS="${OFFSITE_RETENTION_DAYS:-$(read_env_var OFFSITE_RETENTION_DAYS)}"

if [[ -z "$OFFSITE_RETENTION_DAYS" ]]; then
  OFFSITE_RETENTION_DAYS="$RETENTION_DAYS"
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%F_%H-%M-%S)"
ARCHIVE_PATH="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.archive.gz"
CHECKSUM_PATH="$ARCHIVE_PATH.sha256"

echo "[backup] Avvio dump esterno: db=$DB_NAME, out=$ARCHIVE_PATH"
mongodump \
  --uri="$MONGODB_URI" \
  --db="$DB_NAME" \
  --archive="$ARCHIVE_PATH" \
  --gzip

sha256sum "$ARCHIVE_PATH" > "$CHECKSUM_PATH"

find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.archive.gz" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.archive.gz.sha256" -mtime +"$RETENTION_DAYS" -delete

if [[ -n "$OFFSITE_REMOTE" ]]; then
  if ! command -v rclone >/dev/null 2>&1; then
    echo "[backup] OFFSITE_REMOTE configurato ma rclone non installato." >&2
    exit 1
  fi

  REMOTE_BASE="$OFFSITE_REMOTE"
  if [[ -n "$OFFSITE_PATH" ]]; then
    REMOTE_BASE="$OFFSITE_REMOTE:$OFFSITE_PATH"
  fi

  echo "[backup] Sync offsite verso $REMOTE_BASE"
  rclone copyto "$ARCHIVE_PATH" "$REMOTE_BASE/$(basename "$ARCHIVE_PATH")"
  rclone copyto "$CHECKSUM_PATH" "$REMOTE_BASE/$(basename "$CHECKSUM_PATH")"

  rclone delete "$REMOTE_BASE" --min-age "${OFFSITE_RETENTION_DAYS}d" --include "${DB_NAME}_*.archive.gz"
  rclone delete "$REMOTE_BASE" --min-age "${OFFSITE_RETENTION_DAYS}d" --include "${DB_NAME}_*.archive.gz.sha256"
fi

echo "[backup] Completato con successo"
echo "[backup] Archive: $ARCHIVE_PATH"
echo "[backup] Checksum: $CHECKSUM_PATH"
if [[ -n "$OFFSITE_REMOTE" ]]; then
  echo "[backup] Offsite remote: ${OFFSITE_REMOTE}${OFFSITE_PATH:+:$OFFSITE_PATH}"
fi