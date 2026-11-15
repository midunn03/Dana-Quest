# Retained Django Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task by task. No Git mutations, worktree or commits. Checkboxes track actual evidence.

**Goal:** Complete the approved Django slice while preserving its existing administration and the current hybrid Node/Django development setup.

**Architecture:** Keep public place/event feeds public and Django admin protected by staff permissions and CSRF. Bind private account/game/quest APIs to the captured tab owner. Add database-backed quest runs and hashed activation codes with transactional writes; use Node as the executable contract oracle without changing gameplay or selecting a new storage architecture for Node.

**Tech Stack:** Django5.2, SQLite memory test DB, Node HTTP/store contract oracle, Vitest.

**Spec:** Supplemental attachment3b6f80f4-06ee-4d76-ac40-7f1228a02f67 and owner's explicit approval of green v2.2 + retained Django for admin,31/10/2026.

## Global Constraints
- No real DB/migration/media/secrets/.data access. Source migration files only; apply solely to memory tests.
- No fonts, UI colors/CSS, GPS/camera, OSM or Web Push changes. DUE arrival remains visual self-confirmation.
- Keep existing A2/A3 tests and passing fixes; new bugs get red→green regressions. No changed expectations to force a pass.
- Preserve API IDs/shapes, action guards, grading and reward values; do not switch the running frontend from Node auth to Django.
- Stop/report after this Django group; G/F are not implemented in this slice.

## Review Focus
- Stale header must fail before any private read/write, including photos/codes.
- Public catalog feeds must remain usable anonymously; Django admin must not require a header browser admin forms never send.
- Corrupt photos/state cannot trigger unbacked resets; valid photo bytes and timestamps survive recovery.
- Quest retries/out-of-order actions/paused runs and catalog migration must match Node; no client photoAvailable trust.
- Code redemption across accounts must be atomic, idempotent for its owner, expiry/revocation aware and throttled.

### 1. Baseline and ownership audit
**Files:** docs/TASKS.md, this plan; backend accounts/pixels/events URLs/views/admin (read).
- [x] Re-run guarded build/full Node tests/lint and memory-only Django tests before runtime edits.
- [x] Inventory public/private/admin endpoints. Add regressions for public anonymous feeds, supplied stale headers, unsupported writes and staff admin access. Private endpoints require headers; public feeds optionally validate supplied headers on authenticated sessions.

### 2. Recursive photo integrity/recovery
**Files:** backend/game/rules.py, views.py, models.py, new migration; backend/game/tests.py.
- [x] Add failing nested photo validation and reset-preservation tests, including invalid metadata/timestamp/data.
- [x] Extend is_healthy with optional photo collection validation (keep pure-state callers compatible). Validate full saved snapshot at read/write boundaries.
- [x] Backup state/revision plus a byte-preserving JSON representation of photo records before replacing state. Never delete or alter saved photo rows on reset; refuse corrupt reads/actions. Verify transaction rollback and valid timestamps.

### 3. Quest-runs / quest-codes contract
**Files:** new backend/game/quest_rules.py, quest_views.py, models/migration; backend/accounts/urls.py; backend/game/test_quest_contract.py; tests/support/django-contract-oracle.mjs.
- [x] Add Node oracle for synthetic HTTP requests/actions and code cases using TEMP files. Compare status/payloads and fixed-clock results in Django tests; observe route404/red first.
- [x] Implement Python grading for all existing challenge types and Node catalog migration/phase guards; reject invalid stored runs422 without overwriting. Server time is authoritative. Never accept client photoAvailable as evidence.
- [x] Implement GET/POST quest-runs with captured owner, user-row locking and JSON persistence. Read-only existing admin remains intact.
- [x] Implement hashed-code GET/redeem with current catalog IDs, normalization, uniqueness/expiry/revocation, atomic claims and10/min throttle; strict tab ownership is an intentional security addition where Node codes currently lack it. Preserve normal status/payload/message contracts and document that exception.
- [x] Generate migration source and run migration consistency check only against memory settings. Test known/unknown/malformed/revoked/expired/used codes, retries, stale owners and corrupt snapshots. Compare unchanged Node paths with real Node oracle.

### 4. Verification / report
**Files:** docs/ENV.md, docs/REVIEW-FIX-REPORT-2026-10-31.md; revised sequence plan status.
- [x] Build/full Node tests/lint + isolated accounts/game/pixels/events tests and migration drift check. Retain admin registration/permissions and test catalog edits under synthetic staff account.
- [x] Document source migration deployment prerequisite and unchanged hybrid routing; adding these routes does not imply wallet/account-features parity or automatic data migration.
- [x] List actual changed/new files and red/green evidence; disclose physical GPS/camera, Safari/iOS, load, HTTPS/proxy and16quest field validation(O-09) unverified. Stop for group approval.
