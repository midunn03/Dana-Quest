# Readability and five UI fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Increase readable pixel typography and correct quest play/exit, creator card, Discovery intro placement, and the account workspace heading.
**Architecture:** Update central typography tokens and responsive navigation allowance. Restore missing state root classes and CSS at each component owner; preserve game state transitions, handlers, routes and existing text. Use existing pixel colors, stepped borders and real bold English face rather than synthetic font weight.
**Tech Stack:** React 19, TS, CSS, Vitest and Playwright at localhost:5174.
**Spec:** User's five requested UI corrections and three screenshots, 2026-10-29.

## Global Constraints
- Plan before code. Only Dana-Quest-nhanh-dung, no GitHub push.
- Preserve game state, data IDs, storage/API contracts, quest answers, routing and existing test expectations.
- No !important or end-of-file patch layers; edit owning rules in place.
- Preserve self-hosted Tiny5/English fallback and CSS weight 400; emphasis uses pixel-bold face, size, yellow background and navy frame.
- Keep sizes on the existing 8px pixel scale; increase default text from 16 to 24px, headings by one scale step. Expand mobile nav allowance only through its canonical token so labels fit.

## Review Focus
- Larger VI/EN labels and accented headings must fit 390/768/1440 without horizontal overflow or clipped navigation.
- Quest exit must look like the rest of the pixel game and return to paused play without losing progress.
- Creator card must work on a direct details load, not depend on previously visiting CreatorPage.
- Discovery intro must precede result cards with real spacing, including search/empty states.
- Account heading remains visible/emphasized on responsive layouts; sidebar navigation and focus still work.

### Task 1: Typography and responsive fit
**Files:** src/ExperienceTokens.css, src/MainNavigation.css, src/QuestPlayPage.tsx and .css, other owning rules only when actual overflow is reproduced.
**Interfaces:** --text-sm becomes 24px, md 32px, lg 40px, xl 48px, 2xl 64px, 3xl 80px. --px-nav-height remains sole nav/action height, responsive 112px on mobile and 80px desktop.
- [x] Save baseline and screenshots before changes.
- [x] Increase typography tokens and update mobile nav leading to fit two-line 24px labels.
- [x] Set default quest reading size to 24px and provide 24/32/40px reading choices with the existing UI control; no game state/action changes.
- [x] Check real controls, headers, cards, inputs and long content in VI/EN; fix overflow at original owners.

### Task 2: Play state and creator ownership
**Files:** src/QuestPlayPage.tsx, src/QuestPlayPage.css, src/QuestDetail.css, src/CreatorPage.css; new tests/ui-polish.test.tsx.
**Interfaces:** Exit main carries quest-player root; existing exit link/button handlers unchanged. Creator link keeps its href and data, owns .qd-creator-link styling under .qd-page.
- [x] Add regression checks for exit root/card, return-to-paused handler and default reading size.
- [x] Give exit/status states a bordered pixel surface, clear action group and bounded readable copy; retain fullscreen navigation behavior.
- [x] Move the five misplaced creator-card rules to QuestDetail.css (verify CreatorPage does not render those classes), style icon/body/arrow and responsive wrapping; no purple raw links.
- [x] Strengthen existing play action/panel borders at their original rules for consistent pixel treatment.

### Task 3: Discovery intro and account heading
**Files:** src/Discovery.css, src/WorkspaceNavigation.css, src/WorkspaceNavigation.tsx (presentation wrapper only).
**Interfaces:** Discovery header/title/search/intro/results/cards in predictable order; intro is a separate box with margin. Workspace heading is a yellow/navy panel with English bold face available and VI glyph fallback, no fake weight.
- [x] Place intro after search and before result heading/grid; give it a 4px navy frame, sky-light surface and 24px separation.
- [x] Apply yellow heading panel, strong frame/shadow, larger title; on mobile keep the heading above a separately scrolling row of account links, so auto-scroll to the current link does not hide the heading.
- [x] Verify existing account routes/current-item highlighting and keyboard access.

### Task 4: Verification/report
**Files:** scripts/verify-readability-polish.cjs, docs/READABILITY-UI-POLISH.md, .data/readability-polish/.
- [x] Browser 390/768/1440 in VI/EN: direct quest details/creator card, Discovery intro, Account sidebar, active/paused/exit/return states, Home and Events; assert real geometry and no page errors.
- [x] Exercise reading-size control, actual exit/return, creator link and quest navigation guard without replacing handlers.
- [x] Run build, full npm test and lint baseline comparison. Preserve all existing tests; report screenshot paths and limitations.

## Completion
All five requested UI fixes implemented. Larger type also required atlas sidebar scroll reflow and a two-row mobile quest HUD; these were verified by real browser interaction. Final build passed, 238/238 tests passed, no new lint warnings. See docs/READABILITY-UI-POLISH.md.
