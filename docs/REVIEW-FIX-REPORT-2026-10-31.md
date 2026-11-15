# Review remediation report — group A and retained Django

> Latest approved decisions31/10/2026: palette **green v2.2**, **retain Django for admin**. The retained-Django implementation and fresh results are recorded at the end. Earlier group-A stop/decision notes below are historical and superseded by those approvals. UI palette implementation remains scheduled for F after G proposals.

Date: 2026-10-31. Working folder: `Dana Quest 2/Dana-Quest-nhanh-dung`.

## Approved scope and plan

Implemented A1–A3; A4 is an inventory/proposal only. Plan was written before implementation in `docs/superpowers/plans/2026-10-31-group-a-security-reliability.md`. `CLAUDE.md` was absent at the project root; the available DOC-INDEX, ENV, STYLE_PIXEL and referenced security/testing documentation were read. An old export was not accessed to retrieve it.

No branch/commit/push/remote mutation. No UI redesign, global formatting, directory moves, image optimization or gameplay/catalog split. Existing unrelated working-tree changes were preserved; the repository-wide diff includes earlier work and is not a group-A-only diff.

## Implemented

- **A1:** opt-in proxy client IP resolution, safe fallback for malformed/scoped IPv6 headers, retained 15/min IP limit, account-wide 5 consecutive wrong attempts/15min across name/email/IP aliases, reservations for concurrent attempts, success reset and unified `expires` cleanup for all rate-limit buckets. Trust remains off by default. Limits remain process-local RAM.
- **A2:** DEBUG off by default, explicit production key required, development fallback rejected in production, environment host/origin lists including local5174. Explicit test settings use memory-only SQLite.
- **A3:** Django private game/profile/avatar/logout bind cookie user to tab header; session bootstrap is the documented missing-header exception. Browser profile/avatar/logout send captured owner and reject delayed results after a tab owner switch. Deep persisted-state checks cover mission IDs, duplicates, selection/completion relations, timestamps, historical places and vouchers/overspending. Valid optional legacy timestamps remain optional.
- **A3 recovery:** backup JSON/revision before replacing corrupt state, in the same transaction. Backup failure returns503 with original progress/photos intact. Healthy reset is refused. Existing photo rows are retained.
- Pure `apply_action` retains its original outer-shape contract, like Node's action engine; **all public game read/write boundaries deeply validate saved data before invoking it**. Existing engine tests and reward rules were preserved.
- **A4:** exact client import/answer-field inventory and staged public/server catalog proposal in `docs/QUEST-ANSWER-EXPOSURE.md`. Answer-bearing fields still exist in the client: no secrecy claim is made.

## Files modified in this group (11)

| File | Change |
| --- | --- |
| `.env.example` | Proxy/Django variable examples only; no real secret |
| `docs/ENV.md` | Proxy assumptions, secure defaults, isolated tests and migration prerequisite |
| `server/auth.mjs` | Apply proxy/account/IP limits and shared expiry helper |
| `tests/auth-api.test.ts` | Eight added regressions; existing test preserved |
| `backend/config/settings.py` | Debug/key/hosts/origins defaults |
| `backend/accounts/views.py` | Owner checks |
| `backend/accounts/tests.py` | Replace empty scaffold with real tests |
| `backend/game/models.py` | Progress backup model |
| `backend/game/rules.py` | Deep saved-state validator |
| `backend/game/views.py` | Ownership, validation and transactional backup/reset |
| `src/lib/auth.ts` | Captured owner headers and stale-result guard |

## Files created in this group (9)

- `server/auth-rate-limit.mjs`
- `backend/accounts/ownership.py`
- `backend/config/test_settings.py`
- `backend/game/migrations/0002_gamestatebackup.py`
- `backend/game/tests.py`
- `tests/auth-owner-header.test.ts`
- `docs/superpowers/plans/2026-10-31-group-a-security-reliability.md`
- `docs/QUEST-ANSWER-EXPOSURE.md`
- `docs/REVIEW-FIX-REPORT-2026-10-31.md`

No files renamed or deleted in group A. Build regenerated ignored `dist/` and TypeScript build outputs; test dependencies/logs/cache were placed in OS TEMP.

## Verification

| Check | Before A | After A |
| --- | --- | --- |
| `npm run build` | PASS | PASS |
| `npm test -- --maxWorkers=2` | 238/238 PASS | 249/249 PASS, 68 files |
| `npm run lint` | 8 warnings, exit0 | Same 8 warnings, exit0; no new warnings |
| Django `accounts game` | Existing rules8/8 PASS | 29/29 PASS (8 existing +21 new) |
| Django migration/model consistency | Not run before A | `makemigrations --check --dry-run`: no changes detected |

Red→green evidence:

- Initial expanded auth suite:5 failures/3 passes before fix;8/8 after. Additional scoped-IPv6 regression reproduced `Invalid URL`; fixed suite9/9.
- New Django regressions failed before implementation (20 new test methods plus8 existing). After fixes and an additional historical-place compatibility regression:29/29. The historical-place test was also observed failing before its fix.
- Browser header regressions:2 failures/1 pass before fix,3/3 after. Combined existing account-sync tests also passed6/6.
- First full Node pass after implementation:248/248. One additional IPv6 regression was then added; final full rerun:249/249 in92.11s.
- Django discovery from the project root initially found0 tests; corrected explicit app labels ran the real8-test baseline. Zero discovery is not counted as passing coverage.

Tests used synthetic accounts/photos only. Node processes had an FS guard rejecting `.data/`, real DB/media and secret-file access. Django's SQLite connect guard rejected every non-memory database; committed `config.test_settings` was also tested without runtime database overrides. Migration applied only to the in-memory test DB. **No migration was applied to the real database.**

## Pending decisions / stop gate

- **A4 CẦN CHỐT:** retain fully offline/device v2 quest grading (answers necessarily inspectable there), or retire new local play while preserving/exporting old device progress? No implementation until the owner decides.
- B1/B2 remain unstarted proposals: persistence architecture and Node/Django choice. No backend selection was made.
- C/D remain unstarted. Per the user's attachment, stop after group A and wait for approval before the next group. C2 formatting and D2–D5 broad changes also require a confirmed whole-folder copy backup beforehand; D3 remains proposal-only until separately decided.
- E palette/density remains unapproved and unchanged.

## Limits of verification

No real Render/proxy chain, direct-origin protection, HTTPS cookie/origin deployment, camera/GPS on a physical phone, Safari/iOS, real production migration or existing user data was tested. `TRUST_PROXY` was not enabled for deployment. Existing Node HTTPS origin/secure-cookie proxy behavior was not changed by this work. The test suite emits existing jsdom `Window.scrollTo` notices; lint warnings remain in App, Explore, AuthContext and LocaleProvider and are not silently suppressed.

Django needs the backup migration applied through a separately approved deployment process before reset can succeed there. Django does not acquire Node quest-runs/quest-codes parity in group A. No claim of complete product/security optimization is made.

## Approved retained-Django group —31/10/2026

Owner explicitly chose green v2.2 and retained Django because Django admin manages system information. Recorded at the top of TASKS.md before runtime edits. Execution plan: `docs/superpowers/plans/2026-10-31-django-retained.md`; overrides the earlier suggested move directly to group C. This slice stops before G/F.

### Implemented and audited

| Area | Classification and result |
| --- | --- |
| accounts session | Auth required; missing-owner bootstrap supported, supplied stale owner409; existing tests retained |
| accounts profile/avatar/logout | Private; captured tab owner required; existing A3 tests retained |
| game GET/POST/photos/reset | Private; owner checked before state/photos; deep mission/voucher/photo checks; malformed saved data422 |
| pixels places / events feed | Public GET catalog; anonymous/headerless reads preserved. Authenticated requests supplying a stale owner get409 even for POST; supported-owner POST405. No public write API added |
| admin accounts/pixels/events | Existing staff/model permission and CSRF paths preserved, no X-Dana-User requirement on admin forms |
| quest-runs | New GET/POST, private owner guard, server grading and phase/catalog migration rules matching Node on executable scenarios |
| quest-codes / redeem | New private GET/POST paths; hash-only codes, normalization, expiry/revocation/account ownership, owner-idempotent claims and10/min DB-backed attempt limits |
| admin quest records | Read-only progress, backup and code pages registered; no direct add/change/delete bypass for these runtime records. Existing place/event editing remains available |

Recovery now backs up state/revision plus photos before changes, in one transaction. Invalid or excess photos are marked quarantined; bytes and original timestamps remain stored and backed up. Valid active photos and their timestamps are unchanged. If only photos are corrupt, otherwise healthy progress is retained. Post-reset reads succeed with the valid album; repeat reset is refused. Quarantined records are excluded from photo evidence. This is not automatic repair of the original corrupt photo metadata.

SQLite ignores row locks; conditional code claims plus controlled503 responses on OperationalError avoid an uncaught500. Tests simulate contention and rollback; real concurrent load has not been measured. Very large JSON numbers are rejected rather than overflowing Python finite-number checks.

**Contract scope:** the executable oracle starts real Node HTTP auth APIs with synthetic TEMP accounts/codes, then compares status/body against Django:48 quest actions (49 snapshots including initial GET),7 redemption cases plus code listing and stale quest owner;72 grading cases derived from the16quest catalog including the photo flag. DUE keeps visual arrival confirmation. No GPS or reward value changed. Node code endpoints currently omit owner-header enforcement; Django intentionally requires it for stale-tab protection. Invalid Python catalog-version types are rejected422 rather than adopting Node coercion quirks. Database-backed throttles survive Django restart, unlike Node RAM counters. These exceptions are documented rather than described as byte-for-byte parity for every malformed input.

### Changed files in this slice (14)

- `docs/TASKS.md`: written palette/backend decisions, updated palette blocker.
- `docs/superpowers/plans/2026-10-31-revised-review-sequence.md`: approved gates/current status.
- `docs/ENV.md`: retained hybrid setup, endpoint ownership, recovery/migration/test guidance.
- `docs/REVIEW-FIX-REPORT-2026-10-31.md`: this staged report.
- `backend/accounts/ownership.py`: optional supplied-owner check for public catalogs.
- `backend/accounts/urls.py`: quest API routes.
- `backend/pixels/views.py`, `backend/events/views.py`: public-catalog guard, no content/schema redesign.
- `backend/game/models.py`: quest/code/attempt models, backup photo snapshot, quarantine field.
- `backend/game/rules.py`: nested photo checks and safe finite-number validation.
- `backend/game/views.py`: full snapshot validation, backup/quarantine recovery and valid-photo evidence.
- `backend/game/admin.py`: new read-only admin views and quarantine visibility.
- `backend/game/tests.py`: added corruption/recovery/large-number regressions; existing expectations preserved.
- `src/lib/activation.ts`: owner headers and delayed-result rejection for activation reads/writes.

### New files in this slice (9)

- `docs/superpowers/plans/2026-10-31-django-retained.md`
- `backend/game/quest_rules.py`
- `backend/game/quest_views.py`
- `backend/game/test_quest_contract.py`
- `backend/game/test_admin_feeds.py`
- `backend/game/migrations/0003_gamestatebackup_photos_questactivationcode_and_more.py`
- `backend/game/migrations/0004_gamephoto_quarantined.py`
- `tests/support/django-contract-oracle.mjs`
- `tests/activation-owner.test.ts`

No renames/deletions. No Git mutations. Generated build outputs are not counted as source edits. No real database/media/secrets/.data accessed; only memory test migrations. **New Django schema is source/test only, not applied to the running database.** New model/admin/API paths require a separately approved backed-up deployment migration before live use.

### Fresh checks and red→green evidence

| Check | Before this slice | After this slice |
| --- | --- | --- |
| npm run build | PASS | PASS; main JS445.04kB /136.97kB gzip |
| npm test -- --maxWorkers=2 |249/249,68files |252/252,69files |
| npm run lint |8warnings,exit0 |same8warnings,exit0 |
| Django isolated app tests |29/29 |41/41 |
| Migration drift | source consistent before additional models | `makemigrations --check --dry-run`: no changes detected |

New route/ownership/photo tests failed before implementation. Initial test harness needed explicit UTF-8 on Windows; that harness error was corrected and the route test rerun red due to the missing model. Activation headers/delayed-response tests failed3/3 before fixing and pass3/3 after. Admin registration test failed before registration. Additional malformed-version, huge-number, SQLite-contention and post-reset usability regressions were observed red and then green. Final independent review rechecked its three actionable findings and found their fixes addressed; it did not claim load testing.

The41 Django tests were also rerun using committed config.test_settings without database overrides, under a connection guard forbidding non-memory SQLite. All migrations applied only to the ephemeral test DB. Existing Node suite still emits jsdom scrollTo notices. No lint suppression, font/CSS change, changed test expectation or gameplay rewrite.

### Remaining scope and verification limits

- G proposals are next after owner review; F applies the approved green palette only afterward. Group C formatting/old LandmarkArt extraction/folder moves remain deferred as requested.
- A4 still proposal-only and mandatory before real-value rewards, rankings or public release; challenge_secrets design and local-mode choice remain pending. No new answer secrecy is claimed.
- Existing dev routing is hybrid: Node auth/game, Django admin/public feeds. Adding Django routes is not a switch of the running backend or migration of Node accounts/codes/progress. Wallet/account-features/community parity and an operator workflow for issuing Django codes are outside this slice. New quest admin data views are intentionally read-only.
- A1 was not changed again. Current expiry tests demonstrate a unified expires field; no new blanket claim is made that every previous Map entry leaked.
- **Not verified:** physical-phone GPS/camera, Safari/iOS, concurrent-user load, real HTTPS/proxy setup, real deployment migration, or field correctness of the16quest contents/answers(O-09). Test agreement with the catalog does not validate it in the real world.
- Stop after this Django group per the owner's per-group review requirement. No G/F changes or real DB migration are implied by completion of these source/test edits.

## Group G — proposals delivered,31/10/2026

Owner approved continuing from Django to G. Followed the G steps in `docs/superpowers/plans/2026-10-31-revised-review-sequence.md`; **documentation only**, no application/backend/style/test/config edits, no Git mutations or real data access. No G proposal has been implemented by writing these documents.

### Files created (4)

| File | Deliverable |
| --- | --- |
| `docs/SHARED-RULES-PROPOSAL.md` | Source inventory across client/Node/Django; canonical public policy plus JS/Python adapters and conformance vectors. Distinguishes80% destination completion from per-mission10coin credit; preserves different legacy/wallet duplicate-redemption contracts |
| `docs/LEGACY-TRANSITION-PROPOSAL.md` | Existing v1 wrapping/catalog upgrade vs future gameplay conversion; preview/non-overwrite/revision/rollback slices, receipt/source provenance and local trust boundary. No legacy route/component deletion |
| `docs/ARRIVAL-VERIFICATION-PROPOSAL.md` | Intentional DUE visual arrival, O-04 options and boundary tests. Explicitly documents existing conservative distance+accuracy≤100m, accuracy≤50m and sample age≤60s; no GPS/camera changes |
| `docs/ROUTE-LOADING-PROPOSAL.md` |10 already-lazy route screens, remaining eager candidates, actual historical445.04/136.97kB main bundle, measurement protocol and no invented savings. Django admin is not a React admin route |

### Files modified (3)

- `docs/DOC-INDEX.md`: list proposal documents and decision status.
- `docs/superpowers/plans/2026-10-31-revised-review-sequence.md`: approved Django handoff, G progress and next gate.
- `docs/REVIEW-FIX-REPORT-2026-10-31.md`: this report.

No renames/deletions. No storage keys, routes, IDs, rewards, answers, font, palette runtime or OSM behavior changed. Generated build artifacts may refresh during verification; they are not source edits.

### Verification

Baseline before G is the freshly completed Django group's build PASS,252/252 web tests,41/41 Django tests and8lint warnings. Fresh post-document checks: build PASS (main445.04kB/136.97kB gzip, unchanged), web tests252/252 across69files in113.29s, Django41/41 in memory, lint exit0 with the same8warnings. `git diff --check` for the edited tracked documents passed. Node processes used the existing private-data access guard; Django connected only to the ephemeral test DB. No red→green bug cycle applies to this proposal-only group because no runtime bug was changed. Document self-review compared requirements G1–G4 with the actual import/rule/storage source, including the rounding table and the GPS accuracy-margin distinction.

### Decisions and next gate

- Next: owner reviews G, then authorizes F to apply the already chosen green v2.2 palette/token/nav/dead-CSS work. G approval does not silently authorize implementing its gameplay/storage proposals.
- O-04 remains open; visual DUE stays. Local v2/legacy transition and reward-equivalence mappings remain owner decisions. Backend kept for admin does not select a full Node→Django wallet migration.
- A4 remains mandatory before real rewards/rankings/public release; shared policy/lazy loading do not hide answers. Its detailed challenge_secrets extension remains in the planned post-F proposal step.
- No new verification of physical-device GPS/camera, Safari/iOS, many-user load, HTTPS/proxy, deployment migration, or the real-world correctness of16quest content/answers(O-09). No bundle saving is claimed for a group that did not change imports.

## Group F — approved green v2.2 UI consolidation

Owner approved G→F. Plan written before runtime edits: `docs/superpowers/plans/2026-10-31-group-f-green-ui.md`. Only CSS, documentation, an isolated browser verification script and visual artifacts changed; no component/gameplay/backend/font/route/API/storage/quest-answer/reward edits. No Git mutation or real data access.

### F1 — tokens, palette and contrast

- Canonical roles in ExperienceTokens.css: ink#1E302A,muted#52665C,page#F7F5EC,surface#FFFFFF,action/success#216447,action-hover#194D37,soft/selected#E4F0E5,info#28657C,focus#1F6080,reward#D5A13A,warning#A83732. Optional play dark tokens do not enable dark mode.
- UI CSS uses semantic roles. Old color names remain only as aliases in the token file for existing artwork consumers: navy→ink,yellow→reward,orange→reward-hover,green→success,sky→info,sky-light→surface-soft,coral→warning,cream→page,white→surface. Original artwork/logo files were not recolored.
- Solid primary actions use white text; secondary/ghost/selected/gold surfaces use dark ink. Added actual hover background changes adjacent to original rules, not tail patch blocks. Corrected inherited Home-anchor/sidebar/badge foregrounds discovered in screenshots.
- Structural audit:0old quest/qd/ap/dq var references outside tokens,0screen CSS hex colors,824spacing references after cleanup. Existing type sizes/font stack unchanged. App loads tokens once before its minimal base CSS; existing page/component ownership retained.

### F2 — layout ownership and navigation

- Exactly one `.app-shell` base rule. MainNavigation.css now owns every quest-main-nav selector, including workspace grid placement previously in WorkspaceNavigation.css. Home renders the same navigation component as browsing/account pages.
- Retained one responsive nav-height token:80px desktop,112px mobile, plus safe area. Quest play hides global nav and reserves exactly one action-area height; content uses the remaining space. No new fixed bar.
- Before matrix found Home header horizontal overflow at320px and cramped language letters at390px. Fixed original small-screen rules to wrap header actions onto a full row, preserve44px language/menu targets, and allow the CTA to flex. No font reduction or JSX changes. After matrix has no overflow.
- Audited qd-creator-link as a live creator summary inside quest details, not leaked Creator-page styling; did not delete it. Shared QuestCoverCard is already used by browsing/account/library code and was not rewritten.

### F3 — verified dead/duplicate rules only

Searches across src/tests preceded removal. Kept shared `.px-modal` because ConfirmDialog and PlayerDialog use it; these are section-based dialogs, not the removed native PixelModal component.

| File | Removed | Rules | Bytes | Physical lines |
| --- | --- | --- | --- | --- |
| src/ui/PixelUI.css | unused px-label, native modal backdrop/open rules and unused modal-header rules; stale reduced-motion selector |5 |429 |2 |
| src/ui/Controls.css | duplicate button/link focus rule covered by the existing broader rule |1 |91 |0 |
| src/ActiveMissionIndicator.css | duplicate hover rule; existing identical hover background and base inverse text retained |1 |114 |1 |
| Total | Dense CSS can contain several rules on one line |7 |634 |3 |

Auth.css,Account.css,GameVisual.css,QuestPlayer.css,Workspace.css and the dead PixelUI component exports were already absent before this group; **0new file/component deletions claimed** for them. Explore retains live atlas styles. q-briefing-start remains. Home user rules at different breakpoints/properties were retained rather than falsely called duplicates.

### Files changed

CSS files (42, including token source):

`src/ExperienceTokens.css`, `src/AccountReference.css`, `src/ActiveMissionIndicator.css`, `src/AvatarPage.css`, `src/BookingPage.css`, `src/CameraPage.css`, `src/CelebrationPage.css`, `src/CoinShop.css`, `src/ConfirmDialog.css`, `src/CreatorPage.css`, `src/DestinationSheet.css`, `src/Discovery.css`, `src/DueStartPage.css`, `src/EventDetailsPage.css`, `src/EventNotice.css`, `src/Events.css`, `src/Explore.css`, `src/HomePage.css`, `src/index.css`, `src/InformationPage.css`, `src/LoginBackdrop.css`, `src/LoginExperience.css`, `src/MainNavigation.css`, `src/NavigationPage.css`, `src/NearbyDrawer.css`, `src/OnboardingPage.css`, `src/PageTools.css`, `src/PhotoMission.css`, `src/PlayerCard.css`, `src/PlayerInformation.css`, `src/Quest.css`, `src/QuestCover.css`, `src/QuestDetail.css`, `src/QuestLibrary.css`, `src/QuestPlayerUi.css`, `src/QuestPlayPage.css`, `src/VoucherWallet.css`, `src/WorkspaceNavigation.css`, `src/ui/Controls.css`, `src/ui/MapControls.css`, `src/ui/PixelUI.css`, `src/ui/QuestCoverCard.css`.

Documentation modified: `STYLE_PIXEL.md`, `docs/TASKS.md`, `docs/REVIEW-FIX-REPORT-2026-10-31.md`, `docs/superpowers/plans/2026-10-31-revised-review-sequence.md`.

New source/document files: `scripts/verify-f-ui.cjs`, `docs/superpowers/plans/2026-10-31-group-f-green-ui.md`. No renames, source-file deletion or dependency added. Browser script uses the host's existing Playwright via DANA_PLAYWRIGHT and optional DANA_BROWSER; URL defaults to5174, artifacts resolve relative to the script. Example invocation after setting those environment variables: `node scripts/verify-f-ui.cjs after`.

Visual artifacts: `tests/visual/group-f-2026-10-31/before/` and `after/`,24PNG+results.json in each. Every API call intercepted with synthetic fixtures before navigation; tile requests deliberately aborted to exercise existing list fallback. No real accounts, cookie sessions or private media used. Dev server on5174 used the existing private-data FS guard; watcher warnings reflect blocked private-path enumeration, not permission to inspect those paths. This guarded test server was stopped after verification; it was not left running as a normal account service that could misleadingly fail real sign-ins.

### Checks per slice

| Slice | Build | Full web tests | Lint | Browser |
| --- | --- | --- | --- | --- |
| Fresh baseline |PASS |252/252 |8warnings,exit0 |36cases; Home320overflow reproduced |
| F1 |PASS |252/252 |8warnings,exit0 |Green palette, same known Home320overflow |
| F2 |PASS |252/252 |8warnings,exit0 |36/36, no overflow/page errors |
| F3 |PASS |252/252 on full rerun,69files |8warnings,exit0 |36/36, including actual hover changes and exact nav/action heights |

Opaque foreground/background sampling:60pairs checked, none below4.5:1. This is a scoped sample, not a claim that every pixel/control/state meets an accessibility standard. Widths320/390/768/1440; VI+EN at390/1440, VI at320/768. Screens: Home, Discovery, Explore map with tile failure, active quest challenge, Account, guest Home/auth. Screenshots captured only390/1440. Safe-area CSS retained; actual device insets not physically verified.

Final F3 first suite had251passes/1failure: Node fetch `bad port` in the unchanged randomized-port auth API test. Targeted auth suite reran9/9 unchanged, then the full suite reran252/252 across69files in55.01s. No expectations or fixture ports changed to force a pass. This transient test-infrastructure risk is recorded rather than called a CSS bug or silently omitted. Existing jsdom scrollTo notices remain. Independent read-only review found no significant CSS regression and confirmed live modal styles were preserved. Final scoped `git diff --check` passed.

An automatic approval review previously failed because its usage limit was exhausted; the F2 checks were not executed then. On the owner's resume, the same authorized checks were retried successfully. This was not reported as an unsafe action or a passing test.

### Scope still open

- Lint did **not** reach0: existing8React warnings remain, satisfying the stated minimum of no increase. No hook/route behavior was changed to suppress them. TASK-05's broader redesign is not marked wholly complete from this token/nav audit; TASK-06/format/moves remain deferred.
- Stop after F for review before A4. A4 answer-secret/local-mode decisions remain pending; shared-policy/legacy/GPS proposals remain unimplemented.
- No new verification of physical GPS/camera, Safari/iOS, real concurrent load, HTTPS/proxy or deployment migration; no real-world validation of16quest content/answers(O-09). No Django migration or real-data change in F.
