# Joule: Zero Point - Backend

High-performance Express + MongoDB API layer for authentication, deck management, news, and AI neural interface. Fully decentralized from legacy processing engines.

## Quick Start (Local)

Prerequisites: Node.js 24.x with npm 10+.

1. Create your environment file:

```bash
cp .env.example .env
```

2. Configure required variables in `.env`:

- `MONGODB_URI`
- `OPENAI_API_KEY`
- `JWT_SECRET`

3. Install and run:

```bash
npm install
npm start
```

Default API URL: `http://localhost:3000`

## Environment Variables

### Required

- `MONGODB_URI`: MongoDB Atlas connection string.
- `OPENAI_API_KEY`: OpenAI API key.
- `JWT_SECRET`: JWT signing secret.

### Optional

- `PORT` (default: `3000`)
- `NODE_ENV` (`development`, `production`)
- `CHAT_MAX_MESSAGE_LENGTH` (default: `1200`)
- `CHAT_RATE_WINDOW_MS` (default: `60000`)
- `CHAT_RATE_MAX_REQUESTS` (default: `12`)

## API Surface (V1)

### Authentication (`/api/v1/auth`)

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password/:token`
- `POST /resend-verification`

### Cards (`/api/v1/cards`)

- `GET /`

### News (`/api/v1/news`)

- `GET /`
- `GET /:slug`
- `POST /` (admin)
- `PUT /:slug` (admin)
- `DELETE /:slug` (admin)

### Decks (`/api/v1/decks`)

- `GET /`
- `GET /public`
- `POST /`
- `DELETE /:id`
- `POST /:id/vote`
- `POST /:id/import`

> Note: PDF/TTS export generation has been migrated to the client-side for enhanced privacy and reduced server latency.

### Terminal (`/api/v1/terminal`)

- `POST /chat`

Request example:

```json
{
  "message": "User query/directive",
  "gameState": { "optional": "current_game_context" }
}
```

## Security Notes

- `Authorization: Bearer <JWT_TOKEN>` is required for protected routes.
- Never commit `.env` or secrets to git.
- Rotate exposed credentials immediately.
- Apply rate limiting and strict CORS in production.

## External Backup Strategy (No Atlas Backup Plan)

This project includes two scripts for external backup and restore validation:

- `scripts/backup_external.sh`: creates a compressed MongoDB archive backup with checksum and retention cleanup.
- `scripts/restore_external_test.sh`: restores a backup archive into a test database to validate backup integrity.

### 1) Run a backup manually

```bash
chmod +x scripts/backup_external.sh scripts/restore_external_test.sh
./scripts/backup_external.sh
```

Default output path: `~/mongo-backups`

### 1.1) Optional offsite copy (recommended)

To avoid losing backups if the local machine fails, configure `rclone` and set a remote target.

1. Install and configure `rclone` (example):

```bash
rclone config
```

2. Add these optional variables in `.env`:

```env
OFFSITE_REMOTE=myremote
OFFSITE_PATH=joule-zero-point-backups
OFFSITE_RETENTION_DAYS=21
```

When `OFFSITE_REMOTE` is set, `backup_external.sh` will upload both archive and checksum to the remote.

### 2) Validate a restore test

```bash
./scripts/restore_external_test.sh ~/mongo-backups/cyber_point_YYYY-MM-DD_HH-MM-SS.archive.gz
```

Default test database: `cyber_point_restore_test`

### 3) Schedule daily backup (cron)

```bash
crontab -e
```

Add this line:

```cron
0 3 * * * /bin/bash -lc 'cd /home/simone/Documenti/start2impact/JouleZeroPointDev/backend && ./scripts/backup_external.sh >> ~/mongo-backups/backup.log 2>&1'
```

### Optional environment overrides

- `DB_NAME` (default: `cyber_point`)
- `BACKUP_DIR` (default: `~/mongo-backups`)
- `RETENTION_DAYS` (default: `21`)
- `TEST_DB` for restore test (default: `cyber_point_restore_test`)
- `OFFSITE_REMOTE` (e.g. `myremote`)
- `OFFSITE_PATH` (e.g. `joule-zero-point-backups`)
- `OFFSITE_RETENTION_DAYS` (default: `RETENTION_DAYS`)
