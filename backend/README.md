# Joule: Zero Point - Backend Matrix

The core logic engine and API gateway for the Joule: Zero Point ecosystem. Handles authentication, deck orchestration, and the AI Oracle Terminal discourse.

## Local Initialization

1. Establish your environment configuration:

```bash
cp .env.example .env
```

2. Synchronize mandatory variables in `.env`:

- `OPENAI_API_KEY`: Neural engine access key (OpenAI).
- `ASSISTANT_ID`: OpenAI Assistant identifier for the Oracle.
- `JWT_SECRET`: Security salt for token generation and identity verification.

3. Install dependencies and ignite the node:

```bash
npm install
npm start
```

Default Operational Port: `http://localhost:3000`

## Environmental Signals

### Mandatory

- `MONGODB_URI`: Connection string for the Atlas Matrix (Database).
- `OPENAI_API_KEY`: Access token for the GPT-4o engine.
- `JWT_SECRET`: Cryptographic key for session tokens.

### Optional (Custom Configuration)

- `PORT`: (Default: `3000`)
- `CHAT_MAX_MESSAGE_LENGTH`: (Default: `1200`)
- `NODE_ENV`: (e.g., `development`, `production`)

## Primary API Protocols (V1)

### Authentication (`/api/v1/auth`)

- `POST /register`: Identity creation.
- `POST /login`: Session initiation.
- `GET /search`: Identity discovery.
- `DELETE /account/:username`: Identity decommissioning.

### Card Database (`/api/v1/cards`)

- `GET /`: Global card catalog retrieval.

### News & Lore (`/api/v1/news`)

- `GET /`: News/Story stream retrieval.
- `POST /`: Unified article synthesis (Admin only).
- `PUT /:id`: Article update (Admin only).
- `DELETE /:id`: Article deletion (Admin only).

### Deck Orchestration (`/api/v1/decks`)

- `GET /`: User collection and public library discovery.
- `POST /`: Deck synthesis.
- `DELETE /:id`: Deck decommissioning.
- `POST /:id/vote`: Collective resonance (Voting).
- `POST /:id/import`: Artifact cloning.

### AI Oracle Terminal (`/api/v1/terminal`)

- `POST /chat`: Oracle discourse interface.

Input Payload Structure:

```json
{
  "message": "User query/directive",
  "gameState": { "optional": "current_game_context" }
}
```

## Security Headers

- `Authorization`: `Bearer <JWT_TOKEN>` (Required for identified sectors).
- `x-user`: Transmitted for contextual identity tracking (Voting/Personal filtering).
- `X-Admin-Key`: Required for administrative operations (News management).

## Deployment & Security Protocols

- **Credential Safety**: Never commit `.env` to the source registry.
- **Production Secrets**: Configure environment variables via your provider's secure dashboard (Railway, VPS, VPS, etc.).
- **Key Rotation**: Rotate `OPENAI_API_KEY` immediately if exposed in diagnostic logs or screenshots.
- **Network Armor**: Implement restricted CORS and robust rate-limiting at the reverse proxy layer for production environments.

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
