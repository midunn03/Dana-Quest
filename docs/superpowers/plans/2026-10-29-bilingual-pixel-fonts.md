# Dana Quest bilingual pixel typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Apply Vietnamese Tiny5 and English Game Paused-compatible typography throughout the UI without changing behavior or copy.
**Architecture:** Self-host two font faces. Central typography tokens follow existing html lang; explicit English labels override only presentation. Edit declarations at their owning stylesheets, preserving existing game controls and handlers.
**Tech Stack:** React 19, TypeScript, Vite, CSS, FontTools, Playwright, Vitest.
**Spec:** C:/Users/Admin/.codex/attachments/92a25b45-2d26-49a7-933b-3f7ea6339e0e/Pasted text.txt

## Global Constraints
- Presentation only: preserve functions, content, i18n keys, routes, logic and data.
- Self-host WOFF2, font-display swap, monospace final fallback; no runtime font CDN.
- Font weight 400, font-synthesis none; use a genuinely bold source for English fallback.
- No Game Paused binary is attached: use the explicitly authorized Pixelify Sans Bold fallback. Do not distribute Game Paused without a web-embedding license.
- Text sizes use fixed 8px steps, minimum 16px for inputs/long prose; no fluid pixel font sizes.
- No new !important or appended patch layers; modify owning rules.
- No push, no change to existing test expectations.

## Review Focus
- Vietnamese composed/decomposed diacritics must have font coverage and avoid clipping.
- Live VI/EN switching must update both fonts and preserve form state.
- English labels nested in Vietnamese UI must retain English font; user-entered Vietnamese must remain covered.
- Wider text must not clip navigation, auth controls, quest actions, badges or long names at 390/768/1280.
- Font loading/failure must keep legible text, keyboard focus and existing auth/quest behavior.

### Task 1: Fonts and baseline
**Files:** public/fonts/, index.html; evidence .data/font-migration/.
**Interfaces:** Existing html lang from src/i18n/locale.ts; two local WOFF2 assets and retained license files.
- [x] Save source baseline and build/test/lint evidence; capture VI/EN before screenshots at 390/1280.
- [x] Download Tiny5 from official Google Fonts repository with OFL, freeze regular axes and subset Latin/Vietnamese to WOFF2; verify both mandatory Vietnamese strings via cmap and shaping where available.
- [x] Prepare Pixelify Sans Bold from licensed font source; expose its actual bold outlines as CSS weight 400, limited to basic Latin/punctuation. Record source hashes, glyph coverage and metrics.

### Task 2: Canonical typography and screen migration
**Files:** public/fonts/fonts.css, src/ExperienceTokens.css, src/index.css, existing screen CSS, index.html, STYLE_PIXEL.md.
**Interfaces:** --font-vi, --font-en, --font-ui; --text-sm/md/lg/xl/2xl/3xl; existing --px-font* point to context font. .font-en and [lang=en] supply explicit English context.
- [x] Define lang-context tokens and English-first/Vietnamese-next fallback; replace document font preloads with the two used assets.
- [x] Replace literal font families, font shorthands and weights in original CSS rules. Map fixed typography onto 16/24/32/40/48/64px and preserve existing responsive breakpoints.
- [x] Use uppercase presentation for Vietnamese headings/buttons/labels/menu; preserve input case. Increase prose leading and spacing, permit label wrapping, preserve readable focus styles.
- [x] Audit inline SVG/text and canvas drawing; use tokens or report embedded images requiring originals. Preserve user font-size setting behavior.

### Task 3: Mixed-language labels
**Files:** existing JSX owners, optional src/ui/EnLabel.tsx only if repeated markup justifies it.
**Interfaces:** Native lang=en attribute on fixed English-only label elements. No string mutation and no dynamic DOM text rewriting.
- [x] Inventory authored English labels, XP/LV/brand/steps and numeric rewards; annotate English-only text runs and existing pixel-label containers.
- [x] Check nested Vietnamese names, dynamic user text and accented proper names use Vietnamese fallback glyphs. Keep accessibility names/content unchanged.

### Task 4: Verification and report
**Files:** scripts/verify-fonts.cjs, docs/FONT-MIGRATION-REPORT.md, .data/font-migration/.
**Interfaces:** Browser screenshots and machine-readable font/overflow/network results; existing npm commands unchanged.
- [x] Verify required strings in VI/EN, selected rendered fonts, no missing glyphs, live switch without reload, input state preservation, font requests without 404 and fallback behavior.
- [x] Inspect Home/auth, Discovery/map, active quest, Shop, Account, notification/modal/information at 390/768/1280, including long strings and focus; record screenshots.
- [x] Run build, full npm test, lint comparison; run existing auth/quest guard checks. Capture Lighthouse if tooling exists; otherwise explicitly record unavailable rather than claiming parity.
- [x] Record font licenses, changed files, English-label inventory, size scale, remaining fallback/embedded text, before/after screenshots and targeted rollback instructions.

## Completion notes
Implemented and verified; see docs/FONT-MIGRATION-REPORT.md for evidence and explicit exceptions. Game Paused is absent, so the authorized Pixelify fallback is active. Preserve the existing quest reading-size control as a compatibility exception. Lighthouse after-run recorded; there was no original Lighthouse baseline, so score non-regression remains explicitly unverified.
