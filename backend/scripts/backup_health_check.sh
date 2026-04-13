#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

read_env_var() {
  local key="$1"
  if [[ -f "$ENV_FILE" ]]; then
    grep -E "^${key}=" "$ENV_FILE" | head -n 1 | cut -d= -f2- || true
  else
    true
  fi
}

DB_NAME="${DB_NAME:-cyber_point}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/mongo-backups}"
BACKUP_LOG="${BACKUP_LOG:-$BACKUP_DIR/backup.log}"
MAX_AGE_HOURS="${MAX_AGE_HOURS:-24}"

OFFSITE_REMOTE="${OFFSITE_REMOTE:-$(read_env_var OFFSITE_REMOTE)}"
OFFSITE_PATH="${OFFSITE_PATH:-$(read_env_var OFFSITE_PATH)}"

status_ok() {
  printf 'OK'
}

status_fail() {
  printf 'FAIL'
}

status_na() {
  printf 'N/A'
}

latest_archive="$(ls -1t "$BACKUP_DIR"/"${DB_NAME}"_*.archive.gz 2>/dev/null | head -n 1 || true)"
if [[ -z "$latest_archive" ]]; then
  echo "[backup-health] backup_last24h=FAIL checksum=FAIL offsite=N/A reason='Nessun archive trovato in $BACKUP_DIR'"
  exit 1
fi

now_ts="$(date +%s)"
archive_ts="$(stat -c %Y "$latest_archive")"
age_seconds=$((now_ts - archive_ts))
age_hours=$((age_seconds / 3600))
max_age_seconds=$((MAX_AGE_HOURS * 3600))

if (( age_seconds <= max_age_seconds )); then
  backup_freshness="$(status_ok)"
else
  backup_freshness="$(status_fail)"
fi

checksum_file="${latest_archive}.sha256"
if [[ -f "$checksum_file" ]] && sha256sum -c "$checksum_file" >/dev/null 2>&1; then
  checksum_status="$(status_ok)"
else
  checksum_status="$(status_fail)"
fi

offsite_status="$(status_na)"
if [[ -n "$OFFSITE_REMOTE" ]]; then
  offsite_status="$(status_fail)"

  if command -v rclone >/dev/null 2>&1; then
    remote_base="$OFFSITE_REMOTE"
    if [[ -n "$OFFSITE_PATH" ]]; then
      remote_base="$OFFSITE_REMOTE:$OFFSITE_PATH"
    fi

    latest_basename="$(basename "$latest_archive")"
    if rclone lsf "$remote_base" 2>/dev/null | grep -Fx "$latest_basename" >/dev/null 2>&1; then
      offsite_status="$(status_ok)"
    fi
  fi
fi

overall_exit=0
if [[ "$backup_freshness" == "FAIL" || "$checksum_status" == "FAIL" ]]; then
  overall_exit=1
fi
if [[ -n "$OFFSITE_REMOTE" && "$offsite_status" != "OK" ]]; then
  overall_exit=1
fi

printf "[backup-health] backup_last%sh=%s checksum=%s offsite=%s age_hours=%s latest=%s\n" \
  "$MAX_AGE_HOURS" \
  "$backup_freshness" \
  "$checksum_status" \
  "$offsite_status" \
  "$age_hours" \
  "$latest_archive"

if [[ -f "$BACKUP_LOG" ]]; then
  if grep -F "Archive: $latest_archive" "$BACKUP_LOG" >/dev/null 2>&1; then
    echo "[backup-health] log_reference=FOUND"
  else
    echo "[backup-health] log_reference=MISSING"
  fi
fi

exit "$overall_exit"
