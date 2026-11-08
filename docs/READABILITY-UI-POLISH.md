# Readability and five UI fixes — completion report

Implemented from the plan saved before coding: `docs/superpowers/plans/2026-10-29-readability-five-ui-fixes.md`.

## Five requested changes

1. **Larger text.** Central pixel scale is now 24/32/40/48/64/80px (larger decorative steps remain). Body/supporting text and input defaults increase from 16 to 24px. The quest reading default increases from 18 to 24px; the existing presentation slider offers 24/32/40px and displays the actual applied size. Tiny5, the English bold fallback, font-synthesis:none and CSS weight 400 are preserved. Mobile navigation uses its existing canonical token at 112px plus safe area so two-line 24px labels fit; desktop remains 80px.
2. **Quest play and exit theme.** The exit branch previously rendered only `main.due-exit`; all common player rules required `.quest-player`. It now uses the correct root class and a bounded cream pixel card on sky, flag emblem, clear primary/secondary actions and 4px navy borders. Impossible descendant selectors for root exit/status states were corrected at the owner. Existing save/pause/return handlers are unchanged. Mobile HUD uses a separate full-width row for free-play/no-timer text, avoiding narrow vertical word breaks with the larger font.
3. **Creator card.** Five creator-link rules were incorrectly scoped under `.creator-page` in CreatorPage.css, although the link is rendered in QuestDetailsPage. Verified those classes are absent from CreatorPage JSX, removed the misplaced rules, and restored proper ownership in QuestDetail.css. Card has a framed avatar, grid layout, wrapping body and arrow; original creator URL/data are retained. It works on a direct details load without first visiting the creator profile.
4. **Discovery intro.** Removed the order:6 placement after cards. Intro now follows search and precedes result heading/grid, with a separate sky panel, 4px navy frame and 24px separation. Joined-page utilities keep their spacing. The map link is in the city header row so large Discovery titles use full width instead of being squeezed beside the link.
5. **Account workspace heading.** Your space/Không gian của bạn is a yellow/navy panel with a strong frame, shadow and larger title. Mobile keeps this panel above a separately scrolling link row, so automatic scrolling to the active account link cannot scroll the heading out of view. All sidebar routes and aria-current behavior remain unchanged.

## Responsive repair required by the larger font

The real browser click test found the atlas list collapsing behind its controls at tablet width. Changed the atlas sidebar to scroll its complete contents, keeping its children from shrinking and removing the competing nested list scroll area. Map selection cards have a bounded scrollable height. Markers, filters, geolocation and entry-selection handlers are untouched. The same real click/filter/marker test now passes.

## Files

- `src/ExperienceTokens.css`, `src/MainNavigation.css`
- `src/QuestPlayPage.tsx`, `src/QuestPlayPage.css`
- `src/QuestDetail.css`, `src/CreatorPage.css`
- `src/DiscoveryPage.tsx`, `src/Discovery.css`
- `src/WorkspaceNavigation.tsx`, `src/WorkspaceNavigation.css`
- `src/Explore.css`, `STYLE_PIXEL.md`
- New verification: `tests/readability-ui.test.tsx`, `scripts/verify-readability-polish.cjs`

No changes to game answers, progression actions, rewards, IDs, persistence keys, API contracts or route definitions. No existing tests were edited. The reading-size options are an intentional presentation change requested by the font increase.

## Verification

- Watched the two new regressions fail first: 18px default instead of 24px, and missing quest-player exit root.
- Build passed on the final source.
- **238/238 tests passed:** all 236 existing tests plus two new regressions.
- Lint: zero new warnings relative to this task's baseline. No new !important; CSS invariant check finds none and all authored font weights remain 400.
- Browser 390/768/1440px, VI/EN: Home, atlas, quest play, Account, Events, Shop, joined quests, Discovery and quest details. No document horizontal overflow or page errors.
- Asserted computed 24px base text, Discovery search/intro/results order with at least 24px separation, creator card grid/4px border/navy color, and yellow framed workspace heading.
- Exercised actual creator-link navigation to profile and back; verified direct-load styles before visiting that profile.
- Exercised the real reading slider to 40px and back to 32px; leave/save renders the pixel exit card; returning reopens the same paused quest with preserved progress. Fullscreen exit does not grow a second navigation bar.
- Existing guard still preserves an answer on cancel, stays in place on failed saving, and navigates only after successful retry.
- Existing real authentication overlay script passed at 320×568, 390×844, 844×390 and 1440×900.

## Evidence and rollback

Before screenshots: `.data/readability-polish/before/`. Final screenshots: `.data/readability-polish/after/`. Browser results: `after/browser.json`; full tests: `tests.json`; lint: `lint.txt` and `baseline-lint.txt`.

Useful image names at 390/768/1440 widths: `*-quest-active.png`, `*-quest-exit.png`, `*-creator-card.png`, `*-creator-profile.png`, `*-discovery-intro.png`, `*-workspace-heading.png`, `*-tai-khoan.png`.

The original src tree is saved in `.data/readability-polish/before-src.zip`. To revert only this work, selectively restore the listed src files from that snapshot and restore the typography paragraph in STYLE_PIXEL.md; preserve unrelated existing changes. No reset, commit or GitHub push was performed. The dev server remains at localhost:5174.

External map tiles were unavailable during verification; map controls, list filtering/selection and the fallback layout were exercised. Browser tests used a separate mocked account and temporary quest storage, not the user's account.
