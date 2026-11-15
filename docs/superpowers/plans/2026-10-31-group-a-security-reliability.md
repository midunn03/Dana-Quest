# Group A security and reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Complete only approved group A (A1–A3 fixes and A4 proposal), then stop for owner approval.
**Architecture:** Add opt-in proxy-aware Node throttling without changing sessions or gameplay; harden Django environment defaults; bind private Django requests to the tab owner and keep transactional corruption backups. Test against synthetic records only. Answer segregation remains a written decision proposal.
**Tech Stack:** Node HTTP, React/TS client request headers, Vitest, Django 5.2, SQLite in-memory test database.
**Spec:** User attachment d1ecac3d-7fa2-499a-98f7-5d7a97b13685/Pasted text.txt, 2026-10-31.

## Global Constraints
- Direct edits only: no branch, commit, push, remote change or Git mutation. Only git status/diff for reading.
- Never access .data/, real secrets, backend/db.sqlite3 or user media. Logs/dependencies/test artifacts stay in OS TEMP; Node test processes use an access guard, Django connections are restricted to memory.
- Existing tests/expectations remain intact; add regressions and observe red before implementation.
- Preserve IDs, API/storage shapes, answers, reward rules and progress/navigation guards, except explicitly requested security behavior.
- No broad formatting, directory moves, image compression or UI/palette changes in group A.
- CLAUDE.md is absent in the working project root; DOC-INDEX/ENV/STYLE_PIXEL and referenced security/testing/backend guidance were read. Do not access an old .data export to locate the missing file.
- Stop and report after A. B/E are proposals only; C/D require a separate approval. Backup confirmation is mandatory before C2 and D2–D5 broad changes.

## Review Focus
- Spoofed/malformed X-Forwarded-For must not bypass throttling with proxy trust off; enabling trust requires a controlled proxy and a documented address-chain policy.
- Account identifier aliases, retries and concurrent wrong passwords must not bypass the account lock; success clears consecutive failures and expired buckets are pruned.
- Missing/blank/development production secrets and invalid debug settings must fail safely; local dev remains explicitly opt-in.
- Stale-tab owner mismatch or a missing owner header must not read/write a different cookie account, including photos and reset. Session bootstrap remains the necessary owner-discovery exception.
- Nested malformed progress/redemptions and backup failures must never overwrite stored data; optional legacy timestamps and existing photos remain preserved.

### Task A0: Baseline and isolated test setup
**Files:** docs/superpowers/plans/2026-10-31-group-a-security-reliability.md; OS TEMP test runners/logs only.
- [x] Run npm run build, npm test -- --maxWorkers=2, npm run lint before application edits; record counts and warnings.
- [x] Install Django/Pillow only into TEMP and run baseline with SQLite memory-only connection guard, never migrate the real database.

### Task A1: Proxy-aware login reliability
**Files:** server/auth.mjs, tests/auth-api.test.ts, docs/ENV.md, .env.example; optionally a focused server/auth-rate-limit.mjs helper if needed for auditable expiry/concurrency tests.
**Interfaces:** createAuthApi accepts optional trustProxy (default process.env.TRUST_PROXY === '1'); shared bucket schema {count, expires}. Existing API status/body contracts remain, adding account lock 429 after five wrong attempts in a 15-minute window.
- [x] Add red regressions for ignored spoofed headers by default, separated trusted client IPs, malformed/multi-hop chains, account lock across IPs and username/email aliases, success/expiry, and codes/sensitive bucket cleanup.
- [x] Implement deterministic client address resolution, one expiry schema and cleanup on requests. Bound same-account in-flight attempts so concurrent guessing cannot evade the failure budget.
- [x] Document proxy deployment preconditions; never silently enable TRUST_PROXY or change Render deployment.

### Task A2: Django settings defaults
**Files:** backend/config/settings.py, backend/config/test_settings.py, backend/accounts/tests.py, docs/ENV.md, .env.example.
**Interfaces:** DJANGO_DEBUG only '1' enables debug; production DJANGO_SECRET_KEY required and dev fallback rejected; DJANGO_ALLOWED_HOSTS and DJANGO_CSRF_TRUSTED_ORIGINS comma-separated. Defaults include local 5173/5174 CSRF origins.
- [x] Add red subprocess tests for debug/key defaults and environment host/origin parsing; no real database access.
- [x] Implement defaults and explicit test settings with memory DB and test-only key; preserve runtime DB configuration without opening it.

### Task A3: Django tab ownership and safe recovery
**Files:** backend/accounts/ownership.py, backend/accounts/views.py, backend/accounts/tests.py, backend/game/rules.py, backend/game/views.py, backend/game/models.py, backend/game/migrations/0002_gamestatebackup.py, backend/game/tests.py; src/lib/auth.ts and new tests for authenticated header compatibility if required.
**Interfaces:** private game GET/POST and profile/avatar/logout reject wrong/missing X-Dana-User with 409; bootstrap session without an owner header and anonymous login/register stay usable. Browser private profile/logout requests capture/send the current owner. GameStateBackup stores the pre-reset JSON/revision transactionally; photo rows remain untouched.
- [x] Add red Django API tests for correct/missing/mismatched owner, including profile/avatar/logout, game/photos/actions/reset and session bootstrap.
- [x] Deep-check mission selection/completion/timestamps, duplicate/invalid vouchers and overspending; retain valid legacy records with omitted optional timestamps.
- [x] Persist backup before changing corrupt state in the same transaction; refuse healthy reset; rollback when backup fails; never reset/decode real user records.
- [x] Add migration source only and apply it solely to the test memory DB. Document deploy prerequisite without running any production migration.
- [x] Keep the client request path compatible by adding captured owner headers for authenticated mutations; no UI or game changes.

### Task A4: Answer exposure inventory only
**Files:** docs/QUEST-ANSWER-EXPOSURE.md.
- [x] Inventory exact client imports/fields and runtime branches: catalog, i18n copies, shared grading, local/legacy progress, account server validation.
- [x] Propose public/full catalog separation, server-only answer imports, build checks and transition tests. Mark local/offline policy CẦN CHỐT; do not implement or alter gameplay.

### Group A exit gate
**Files:** docs/REVIEW-FIX-REPORT-2026-10-31.md, docs/ENV.md.
- [x] Re-run build/full Node tests/lint and isolated Django tests; compare warning counts and record red/green evidence.
- [x] Self-review scoped diff and test-only migration safety. Record what was not verified (real proxy deployment, real camera/GPS, Safari/iOS, HTTPS).
- [x] Report modified/new files and group A results. Stop and request approval before group C. Do not start B/C/D/E implementation or the backup-gated actions.
