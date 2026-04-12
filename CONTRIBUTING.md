# Contributing Guidelines

## Language Policy

- Use **English** for all new:
  - comments
  - README updates
  - commit messages
  - pull request descriptions
  - user-facing error messages (unless a specific localized UX is required)

## Commenting Standard

- Prefer self-explanatory code and meaningful names.
- Add comments only when they explain **why**, not obvious **what**.
- Keep comments short, technical, and maintenance-oriented.
- Remove stale comments during refactors.

Good examples:

- Why a timeout value is intentionally high.
- Why a specific security check is required.
- Why a fallback exists for backward compatibility.

Avoid:

- Repeating what the next line already says.
- Decorative or narrative comments.

## Documentation Expectations

For non-trivial changes, update the relevant docs:

- root `README.md` for project-level behavior
- `backend/README.md` for API/runtime/env changes
- `frontend/README.md` for build/test/dev changes

## Git Workflow

- Work on `dev` branch.
- Keep commits focused and atomic.
- Merge `dev` into `main` only after validation and deploy readiness checks.

## Validation Before Push

- Backend: run relevant tests for changed modules.
- Frontend: run `npm run build` and relevant test suites.
- If backup scripts are changed, run one real backup and one restore-test cycle.
