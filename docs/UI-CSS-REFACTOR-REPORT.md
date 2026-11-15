# UI CSS refactor — phases 1–4

Scope: presentation, stylesheet ownership and shared card markup. Existing game handlers, hash routes, data IDs, persistence keys, API contracts and test expectations were preserved. Work is local; nothing was pushed.

## Verification by phase

| Phase | Build | Existing npm tests | New lint warnings | Browser widths |
| --- | --- | --- | --- | --- |
| Baseline | Pass | 231/231 | Baseline captured | — |
| 1: tokens | Pass | 231/231 | 0 | 390, 1440 |
| 2: ownership | Pass | 231/231 | 0 | 390, 1440 |
| 3: dead code | Pass | 231/231 | 0 | 390, 1440 |
| 4: hierarchy | Pass | 231/231 | 0 | 390, 768, 1440 |

The repository contains 231 tests, rather than the 225 stated in the request. No test expectations were changed. Raw results, the original source snapshot and screenshots are in `.data/ui-css-refactor/`. Lint comparisons normalize line numbers against `baseline-lint.txt`.

## Phase 1 — one token system

Changed `ExperienceTokens.css`, `App.tsx`, `PixelUI.css`, and the screen styles using legacy tokens. Tokens load once, first in `App.tsx`. Replaced 318 alias references, converted 947 spacing declarations to the spacing scale, and replaced 69 login hexadecimal color uses.

| Previous family | Canonical token |
| --- | --- |
| dq/qd/ap/quest ink, border, line | `--px-ink` |
| pink/accent aliases | `--px-accent` |
| surface / surface-soft aliases | `--px-surface` / `--px-surface-soft` |
| muted aliases | `--px-muted` |
| text-body / text-small | `--px-text-base` / `--px-text-sm` |
| page-width / form-width / page-gutter / home-max | `--px-page-width` / `--px-form-width` / `--px-page-gutter` / `--px-home-width` |
| dq-radius / dq-motion | `--px-radius` / `--px-duration` |
| competing navigation heights | `--px-nav-height` |

Hover backgrounds use `--px-surface-hover`; action hover uses `--px-action-hover`, so interaction colors differ from their resting colors. The complete alias mapping is in `phase1-token-map.json`. Runtime variables, such as quest font-size preferences, remain runtime variables.

## Phase 2 — scoped stylesheet ownership

`App.tsx` imports only `ExperienceTokens.css` and minimal `App.css`; `index.css` remains the entry reset. There is one `.app-shell` definition. Navigation uses `calc(80px + env(safe-area-inset-bottom, 0px))`.

Screen ownership now includes `CreatorPage.css`, `QuestDetail.css`, `QuestPlayPage.css`, `DueStartPage.css`, `AccountReference.css`, `CoinShop.css`, `QuestLibrary.css`, `InformationPage.css`, `EventDetailsPage.css`, `OnboardingPage.css`, `BookingPage.css`, `NotFoundPage.css`, `AvatarPage.css`, `CameraPage.css`, `CelebrationPage.css`, and destination styles. Each owner imports its stylesheet. Shared navigation, notifications, player information, wallet, map controls and UI controls have explicit component-owned stylesheets.

Creator rules were moved out of quest details; information and navigation rules out of Discovery; Account, Shop and 404 no longer depend on Quest page styling. Existing 404 markup was extracted into `NotFoundPage.tsx` without changing its route condition. This phase primarily moves rules; it does not count moved lines as deleted dead code.

## Phase 3 — verified dead code

Removed unimported `Auth.css`, `Account.css`, `GameVisual.css`, `TravelVisual.css`, `MapCompact.css`, `MobileLayout.css`, `Workspace.css`, `QuestPlayer.css`, `DueExperience.css`, and `JourneyOnboarding.css`, after checking source imports and test references. Some were compatibility shims after phase 2 extraction.

Removed 190 obsolete rule groups / 645 physical CSS lines in the recorded main deletion pass, plus 60 residual non-atlas Explore rules. `Explore.css` now owns atlas styling; reusable Leaflet/player controls live in `ui/MapControls.css`. Removed obsolete full-page/iOS auth layers and duplicate home-user rules. Retained live `.q-briefing-start` and shared modal CSS used by live dialogs.

Removed six unused React primitives: PixelCard, PixelBadge, PixelModal, PixelInput, PixelTab and PixelTooltip (20 physical source lines). Proof and deletion details are in `phase3-dead-css.json`, `phase3-atlas-proof.json` and `phase3-primitives.json`.

## Phase 4 — layout and hierarchy

- `MainNavigation.css`, `WorkspaceNavigation.css`, `App.tsx`: consistent bottom navigation, including Home. Fullscreen play retains its own action bar rather than stacking two navigation bars.
- `QuestDetail.css`, `QuestPlayPage.css`, `DueStartPage.css`: mobile play panel participates in document flow; play actions reserve the canonical navigation height and content receives the remaining area.
- `Explore.css`: mobile title remains visible; map and location list share the available space.
- `LoginExperience.css`, `LoginBackdrop.css`: one pixel card language, with placement variations for inline and modal presentations. Existing authentication handlers remain intact.
- `HomePage.css`, `Welcome.tsx`: primary hero/auth flow comes first; decorative marquee is below the introductory steps. Subsequent quests, rewards, FAQ, CTA and footer remain ordered.
- `Discovery.css`: header, search, filters and results form a clear sequence.
- `AccountReference.css`: desktop profile/community columns, sticky independently scrollable community section, responsive single-column layout.
- `ui/QuestCoverCard.tsx`, `ui/QuestCoverCard.css`, `QuestCover.css`, and Discovery/Album/Account callers: one cover-card structure, preserving existing anchors, content and conditions.

Final ownership review restored live PhotoMission, avatar, player-card and shared map-control styles into their actual owners. Removed the resulting unreferenced `Onboarding.css` and `AvatarCustomize.css`. Quest-specific cover rules are root-scoped to prevent lazy-loaded quest CSS changing Account thumbnails.

Additional verified cleanup: 276 selectors whose classes were absent from source/tests, 18 impossible page-inside-shell ancestor selectors, and 24 existing `!important` declarations. No `!important` remains. These are selector/declaration counts, not additive physical line counts; compressed CSS and moved rules make those measures different. Evidence is in `final-dead-selector-proof.json`, `impossible-ancestor-proof.json` and `important-cleanup.json`.

Responsive browser checks cover Home, Explore map, quest play, Account, Events and Shop at 390/768/1440px: no document horizontal overflow and no page errors. Navigation guard checks confirm cancel preserves the answer, failed saving keeps the player in the quest, and a successful retry permits navigation. Screenshots are under `.data/ui-css-refactor/phase4/`.

External map tiles were unavailable during the browser run; the visible fallback, map controls, title, search and location list were checked. Successful external tile delivery is not verified by this run. Account screenshots use a controlled test account; leaderboard network content is not covered by those screenshots.

## Additional browser-script limitation

The existing standalone `tests/quest-player-browser.cjs` stops at an outdated hint-text assertion outside `npm test`: it expects “Chỉ tìm phần số nhà”, while the unchanged catalog says “Tìm số nhà trong địa chỉ, không dùng năm kỷ niệm.” `legacy-browser-note.json` records byte equality with the pre-refactor catalog. Neither the test nor catalog was edited. The standalone authentication overlay checks passed at 320, 390, 844 landscape and 1440px.

## Phase 5

Optional directory migration and formatting were deferred. They are unnecessary for the CSS ownership/layout fixes and would add unrelated import churn. No claim is made that phase 5 was implemented.
