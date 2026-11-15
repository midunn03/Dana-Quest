# Search header and active quest card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Put the existing global search entry at the top and replace the empty full-width quest status row with one informative, unobtrusive card.
**Architecture:** A shared PageTools header owns the search entry and optional active-quest card in normal layout flow. Keep existing search routes/filtering and active quest selection/href conditions. Bottom navigation retains four visible destinations when the top search entry is present. MainNavigation remains usable independently with its existing five-link contract.
**Tech Stack:** React 19, TypeScript, component-owned CSS, Vitest and Playwright.
**Spec:** User request dated 2026-10-29 and the two screenshots supplied in this chat.

**Diagnosis refinement:** Browser screenshots also reveal the direct page-search defect: Discovery's card grid has the default flex order 0 while title/search have orders 1/2, so cards render before them. Fix the grid order to 5 and assert the actual search input is above the card grid. The shared top search entry additionally removes search from the footer.

## Global Constraints
- Plan before code; work only in Dana-Quest-nhanh-dung; keep localhost 5174; no GitHub push.
- Preserve routes, IDs, storage, API, auth guards, progress selection and resume destinations.
- Preserve existing test expectations and VI/EN typography. No !important or end-of-file patch layers.
- Search means the global search entry currently placed in the bottom menu; the page-specific search inputs already appear near the page heading and retain their filtering behavior.

## Review Focus
- Current quest before/after arrival must still link to directions/play respectively.
- Completed quests and accounts without active quests must leave no empty card row.
- A long quest title must wrap/truncate safely at 390px while the full accessible name remains available.
- Workspace pages must allocate main content the remaining height, without the old blank row above bottom navigation.
- Search and quest card must never overlay scrollable content or fullscreen quest/camera/onboarding controls; auth modal still makes the app inert.

### Task 1: Top search ownership
**Files:** create src/PageTools.tsx, src/PageTools.css; modify src/App.tsx, src/MainNavigation.css, src/WorkspaceNavigation.css, src/index.css; test tests/page-tools.test.tsx.
**Interfaces:** PageTools({route:string, children?:ReactNode}); native search link to #/tim-kiem, current state on that route; optional children holds the existing quest indicator.
- [x] Write failing tests for top search link and route selection, plus active-card composition.
- [x] Add the header before main in App; retain the authentication/onboarding condition around ActiveMissionIndicator.
- [x] Show four bottom destinations only in App layouts with PageTools; preserve MainNavigation standalone five-link behavior.
- [x] Replace workspace grid rows with header/content/nav and remove the old status row. Restore missing shared .sr-only utility in base CSS so search labels do not display as duplicate text.
- [x] Set `.discovery-page > .discovery-grid` order to 5 in src/Discovery.css; verify title → actual input → results/cards, not merely the global search shortcut.
- [x] Keep headers hidden with bottom navigation on fullscreen quest, start, camera and onboarding views.

### Task 2: Informative quest card
**Files:** src/ActiveMissionIndicator.tsx and .css; tests/page-tools.test.tsx.
**Interfaces:** Same active quest and legacy selection and href; card displays continue label, quest/place name, completed/total and arrow. Existing aria-label/title contract retained.
- [x] Test directions/play links, completion counts, completed/empty state and legacy fallback.
- [x] Restructure only card presentation; remove direct-App-shell status-row rules and stale bottom positioning.
- [x] Use a bounded card alongside search on desktop and a wrapped compact layout on mobile. All content stays in normal flow and exposes focus clearly.

### Task 3: Verify and report
**Files:** scripts/verify-search-quest-card.cjs, docs/SEARCH-QUEST-CARD-FIX.md, .data/search-quest-card/.
- [x] Browser checks at 390/768/1440 for Events, Quest library, Account, Discovery, Home, map and active quest; test VI and EN.
- [x] Assert search is above main; only four visible bottom links; card contains title/progress, stays above main, does not intersect main or nav; no blank status row and no horizontal overflow; fullscreen controls remain alone.
- [x] Exercise search filtering and resume routing, cancel/save-failure/retry guard, no-active/completed account and long title.
- [x] Run build, full npm test and lint baseline comparison without changing existing tests. Record screenshots and remaining limits; no push.
