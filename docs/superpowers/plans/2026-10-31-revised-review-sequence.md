# Dana Quest revised review Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in the current session. Steps use checkbox (`- [ ]`) syntax for tracking. No delegation is requested.

**Goal:** Apply the owner's supplemental review in its new order, respecting palette/backend decisions and proposal-only work.

**Architecture:** Freeze runtime edits at unresolved decision gates. Audit the current source rather than assume earlier audit counts still apply. Keep gameplay and persisted contracts stable; separate proposals from implementation.

**Tech Stack:** Vite, React 19, TypeScript, Node, optional Django; Vitest and isolated Django tests.

**Spec:** User attachment `C:/Users/Admin/.codex/attachments/3b6f80f4-06ee-4d76-ac40-7f1228a02f67/Pasted text.txt`, overriding conflicting instructions in attachment `d1ecac3d-7fa2-499a-98f7-5d7a97b13685/Pasted text.txt`.

## Global Constraints

- Direct project edits only. No branch, commit, push, remote changes or Git mutations; only git status/diff for reading.
- Do not access `.data/`, secrets, real database or user photos. Test data must be synthetic and isolated.
- **Do not modify backend/ until the owner explicitly confirms “giữ Django”.** Do not automatically revert prior group-A changes. If the owner requests a rollback, establish the precise changes to reverse without discarding their work.
- Order: E1 → conditional Django → G proposals → F → A4 → remaining work. Stop/report and await approval after each group.
- No font changes. Keep the authorized Pixelify Sans Bold English font; no Game Paused without supplied files and web embedding license.
- No Web Push, OSM background changes, GPS/camera changes or added GPS gate for the DUE demo. Preserve list fallback on tile failure.
- Keep IDs, storage/API contracts, answers, reward rules, routes and progress/navigation guards unless explicitly authorized later. No test expectation edits to force passes, no !important or appended CSS patches.
- Old C2 repo formatting, C4 LandmarkArt extraction and D2 folder rename remain deferred until F is complete. Broad formatting/moves/image compression still need confirmed whole-folder backup.
- Last verified group-A baseline: build PASS;249/249 Node/web tests;29/29 isolated Django tests;8 lint warnings. These are historical results, not newly rerun checks for this document.
- Root CLAUDE.md remains absent. DOC-INDEX, TASKS, ENV and STYLE_PIXEL were consulted; latest user constraints override stale documentation.

## Review Focus

- Stale audit counts may describe already-fixed CSS; verify actual imports/selectors before editing or deleting.
- A palette reference is not owner approval. No token recoloring until a written choice exists at the top of TASKS.md.
- Existing backend changes must not be silently retained as an architectural decision or automatically undone.
- Local v2 grading and legacy v1 progress are distinct; migrations must preserve records and never credit rewards twice.
- A client photoAvailable flag is untrusted evidence; public payload sanitization must include nested answer fields in both languages.

### Gate 1 — E1 palette (approved31/10/2026)

**Files:** after decision only, `docs/TASKS.md` (decision block at the top).

- [x] Read supplemental instruction and current palette blocker. No decision is recorded in TASKS.md.
- [x] Owner explicitly chose green v2.2 in chat31/10/2026.
- [x] Record the exact approved choice and date at the top of TASKS.md. UI implementation remains in F.

### Gate 2 — Django choice

**Files:** if dropped, root `README.md` only; if retained, a separately scoped backend plan followed by authorized backend files/tests.

- [x] Owner explicitly chose “giữ Django” for administration of system information.
- Không áp dụng nhánh “bỏ Django”: chủ dự án đã xác nhận giữ Django.
- [x] Retained Django: inspected existing A2/A3 work; scoped plan in2026-10-31-django-retained.md. Existing fixes preserved.
- [x] Fresh baseline + red/green regressions + Node HTTP contract oracle; memory-only tests, no real DB access.
- [x] Reported Django files/results/limits; owner approved continuation to G in chat.

### Group G — proposals only

**Create:** `docs/SHARED-RULES-PROPOSAL.md`, `docs/LEGACY-TRANSITION-PROPOSAL.md`, `docs/ARRIVAL-VERIFICATION-PROPOSAL.md`, `docs/ROUTE-LOADING-PROPOSAL.md`.

- [x] G1: inventoried client/Node/Django mission/voucher rules and proposed shared policy/adapters plus parity vectors;80% is not a per-mission reward gate.
- [x] G2: proposed incremental transition, source snapshots, conflict/provenance handling and no duplicate credit; no routes/components/storage changed.
- [x] G3: documented visual DUE and the exact legacy GPS rule(distance+accuracy≤100m, accuracy≤50m); O-04 remains open, no GPS change.
- [x] G4: inventoried10 existing lazy screens and remaining candidates; historic main445.04/136.97kB, new implementation measurements deferred until after F.
- [x] Reported4new proposal documents/3updated docs, fresh build252web/41Django/8lint results and pending decisions. Stop for owner approval before F; no proposal implemented in runtime.

### Group F — palette-gated CSS consolidation

**Inspect before naming final edit set:** `src/ExperienceTokens.css`, `App.tsx`, screen-owned CSS and `src/ui/PixelUI.tsx`; relevant tests. Record the source-derived edit list before implementation.

- [x] Fresh baseline + before/after synthetic screenshots;36cases across320/390/768/1440 with VI/EN at390/1440. No real API/store/media used.
- [x] F1 canonical green roles/visible hover/foreground fixes;0old alias references and0hex colors outside token CSS;824spacing references. Existing token-first loading retained.
- [x] F2 one shell base/nav owner;80/112 responsive token; Home320header fixed;36/36browser checks show one quest action area and no overflow.
- [x] F3 searched source/tests before removing7rules,634bytes/3physical lines. Kept live modal/creator-link/briefing/atlas rules; previously deleted files not counted again.
- [x] Minimum lint requirement met: unchanged8warnings, no suppression or unrelated hook behavior changes;0warning goal remains open and explicitly reported.
- [x] Build/full tests/lint run per slice. Final252/252 full rerun after documented transient auth test port failure; no test edits. Final browser36/36 and scoped contrast sample60pairs≥4.5:1.
- [x] Report includes exact files/mappings/deletions/checks/limits; stop for owner review before A4.

### A4 — client answers, proposal only and release prerequisite

**Modify:** `docs/QUEST-ANSWER-EXPOSURE.md`.

- [ ] Extend the existing inventory explicitly for acceptedAnswers, correctOptionId(s), correctOrder, nested pairs and client photoAvailable.
- [ ] Propose server-side challenge_secrets storage, public display-only payloads, authoritative grading/result writes and migration/parity tests. Schema is a proposal and must match the eventual backend choice; no DB creation now.
- [ ] Record that client photoAvailable cannot prove an uploaded photo; propose server-owned evidence lookup. Preserve current photo/GPS behavior pending approval.
- [ ] Mark remediation mandatory before real-value rewards, rankings or public release; this document alone does not satisfy that release gate. Obtain the local/offline decision before implementing any split.
- [ ] Report and stop. Do not modify challenge answers or bundle imports in this proposal step.

### Remaining work and report

**Modify:** `docs/REVIEW-FIX-REPORT-2026-10-31.md` as groups are actually approved/completed.

- [ ] Reconcile remaining B/C/D/E tasks only after preceding gates. B persistence/backend choice and E density remain proposals. A1 wording must describe verified expiry-field evidence, not repeat an unverified blanket bug claim; retain passing A1 fixes/tests.
- [ ] Keep formatting, LandmarkArt extraction and folder moves deferred until F passes and required backup is confirmed.
- [ ] In every report distinguish executed checks from historical numbers and proposals from implementation; list changed/new/renamed files.
- [ ] Explicitly disclose unverified physical-phone GPS/camera, Safari/iOS, concurrent-user load, HTTPS/proxy deployment and field verification of all16 quest contents/answers (O-09).

## Current execution status

E1/Django/G completed in their approved scopes; owner authorized F. F CSS/token/nav/dead-rule changes are implemented and verified as recorded in the staged report. Stop after F before A4. Existing8React lint warnings and broader TASK-05 verification remain explicitly open; no new gameplay, legacy retirement, GPS, backend switch or real DB migration is implied.
