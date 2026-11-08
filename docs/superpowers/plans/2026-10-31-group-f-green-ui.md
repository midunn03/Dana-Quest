# Group F green v2.2 Implementation Plan

> Execute inline using safe-refactor and frontend-ui-engineering. User approved G→F. No Git mutation, no worktree/commit/push. This plan is written before runtime edits.

**Goal:** Complete the remaining palette/token/navigation/dead-CSS work against current source, preserving all gameplay and functional contracts.
**Architecture:** Canonical semantic tokens in ExperienceTokens.css; scoped styles remain owned by their screens. Existing nav-height and shell ownership are retained if verified correct. Green primary surfaces use white text; reward gold keeps dark text. Browser verification uses intercepted synthetic API responses, not real sessions/data.
**Spec:** attachment3b6f80f4-06ee-4d76-ac40-7f1228a02f67 and written green v2.2 decision in TASKS.md.

## Constraints and current audit
- No logic/routes/IDs/storage/API/answers/reward changes; no fonts/GPS/camera/OSM changes. No !important or appended patch layers.
- Old alias var(--quest-/--qd-/--ap-/--dq-) count is already0; app-shell base definition already1; App has tokens + minimal App.css, screens own CSS. Do not redo them.
- Auth.css, Account.css, GameVisual.css, QuestPlayer.css, Workspace.css are already absent. PixelUI dead component exports already removed; residual dead modal/input selectors still need search.
- Nav already renders on Home; quest play hides global nav and uses a flow action area sized by px-nav-height. Preserve this behavior, verify computed layout.
- Baseline source last verified252web/41Django/8lint; run fresh build/test/lint before edits. Full checks after F1, F2, and each F3 deletion batch. No lint suppression: minimum no increase; unrelated hook behavior changes remain out of this CSS scope.

## Tasks
- [x] Baseline: fresh build/test/lint; synthetic before screenshots390/1440 VI+EN for Home, Discovery, Explore map(tile fallback), quest play, Account and guest auth. Check320/768 widths too.
- [x] F1: implement v2.2 primitives + semantic action/ink/focus/reward/soft tokens in ExperienceTokens.css; map existing primitive consumers to semantic roles in original rules. Keep typography exactly. Update button/selected-state foregrounds, visible hover and focus contrast; no palette mixing/hardcoded screen hex. Run build/full tests/lint and compare screenshots.
- [x] F2: verify shell/nav/token import ownership. Consolidate nav placement rule out of WorkspaceNavigation.css into MainNavigation.css, preserving grid placement. Keep one nav-height token, one shell base, one action bar for quest; no JSX route/guard changes. Run full checks and viewport/locale matrix.
- [x] F3: search TSX/tests before every deletion. Remove only demonstrated unused PixelUI CSS and duplicate inert rules; already-removed audit files counted as0new deletion. Retain q-briefing-start and dynamic selectors. One deletion batch, full checks afterward.
- [x] Documentation: update STYLE_PIXEL palette roles without font changes, TASKS evidence/status, staged report with files/mappings/removed lines and fresh results. Stop after F before A4.

## Review focus
- Green CTA text must be white, while gold/soft surfaces keep dark ink; hover must change actual color.
- Account/quest actions must remain reachable on short/mobile viewports; no horizontal overflow or double-reserved navigation area.
- Shared SVG artwork must keep intentional illustration colors; do not recolor asset files as if CSS UI tokens.
- Login remains an embedded card/modal with its existing background; no full-page routing rewrite.
- Existing tests referencing styles/components forbid deletion even if a selector appears unused in one screen.
