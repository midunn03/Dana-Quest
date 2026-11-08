# Official logo integration —31/10/2026

Implemented after the user supplied the official Dana Quest logo and requested a plan before edits. Plan: `docs/superpowers/plans/2026-10-31-official-game-logo.md`.

## Artwork and export

- Input1536×1024 RGB PNG has a baked checkerboard, not transparent alpha. Untouched copy: `docs/art-direction/official-logo/source.png`.
- SHA256 of both original user file and untouched copy: `47421807063DE6E41D4BC3FAA87D25C36F1446D74F4063696715726A33AC7A4E`.
- Background-removal derivative made with imagegen, saved as `docs/art-direction/official-logo/transparent-master.png`. RGBA alpha is present; lettering/map/pin/colors were visually inspected against the source. This is an AI-derived cutout, not a claim of pixel-for-pixel identity with the opaque source.
- `scripts/export-brand-assets.cjs` uses browser rendering to export deterministic sizes of this same artwork, not additional generated designs. Cropped only exterior padding (viewBox239 71 1072 872 retains the complete visible silhouette); no lettering reconstructed, no UI-palette recoloring.

| Public asset | Actual dimensions | Use |
| --- | --- | --- |
| brand/dana-quest-logo.png |640×521,RGBA | Shared logo image,274643bytes |
| brand/icon-32.png |32×32,RGBA | Browser favicon |
| brand/icon-180.png |180×180,RGB | Apple touch icon |
| brand/icon-192.png |192×192,RGBA | PWA/notification icon |
| brand/icon-512.png |512×512,RGBA | PWA icon |
| brand/icon-maskable-512.png |512×512,RGB | Maskable icon, complete artwork within safe padding |
| dana-social.png |1200×630 | Existing OG/Twitter URL retained, new official logo composition |

Maskable/Apple/share compositions use the existing cream page background. PNG types/dimensions were checked against the manifest. Original/source/master are documentation assets, not downloaded by the UI.

## Changed locations

- PixelLogo is now a shared image renderer with contained proportions and empty alt/aria-hidden for decorative use. Brand links keep accessible names and their existing Home href.
- WelcomePage header and footer use the official full mark; duplicated font-built DANA/QUEST text removed. Return-player card uses the same logo. Original mobile header rules resized the image without reducing fonts or reintroducing overflow.
- LoginBackdrop's formerly empty logo slot now contains the official logo, including decorative booking/auth backgrounds. Scenery transitions/timers/loading/error behavior unchanged.
- Legacy DestinationPage brand/Home link uses the same logo with a compact size and preserved accessible label.
- Favicon, Apple icon and manifest references updated. Theme/background metadata aligned with the already-approved green v2.2 UI.
- Existing reminder notification icon URLs and service-worker shell identity URLs updated only. No Web Push, permission/scheduling/click/offline behavior or storage/cache key changed.
- Page metadata continues using dana-social.png, whose dimensions remain1200×630. No unnecessary runtime metadata rewrite.
- No remaining live dana-pixel-mark.svg/dana-quest.svg/favicon.svg references in src/index/manifest/sw. Old unreferenced SVG files retained rather than deleting historical assets without need. Textual game names, character sprites, quest art and map markers are not logo placeholders and were not replaced.

## Files modified (13)

`src/PixelLogo.tsx`, `src/WelcomePage.tsx`, `src/HomePage.css`, `src/LoginBackdrop.css`, `src/DestinationPage.tsx`, `src/lib/eventReminders.ts`, `index.html`, `public/manifest.webmanifest`, `public/sw.js`, `public/dana-social.png`, `tests/login-background.test.tsx`, `scripts/verify-f-ui.cjs`, `STYLE_PIXEL.md`.

## Files created

- `src/PixelLogo.css`, `scripts/export-brand-assets.cjs`, `tests/official-logo.test.tsx`.
- The6new public brand PNG assets listed above.
- Original and transparent master under docs/art-direction/official-logo/.
- This report and the implementation plan.
- Browser evidence under `tests/visual/official-logo-2026-10-31/after/` and `tests/visual/official-logo-detail-2026-10-31/after/`.

No component/gameplay/API/route/storage/answer/reward/DB/font change beyond replacing brand markup/assets. No files deleted, dependencies added, Git commit or push. The preceding6230475GitHub commit predates this logo task; these logo edits remain local.

## Verification

- Regression was observed red before implementation: old SVG renderer did not provide the requested image; backdrop slot was empty. Both targeted checks passed after implementation.
- One existing test explicitly required the logo slot to be empty. The user's new logo request supersedes that visual expectation; changed only the test title/logo assertion to require the new image. Existing5photo/20second loop/reduced-motion behavior assertions remain intact; no business-rule expectations changed.
- Build PASS; final full web suite253/253 across70files in113.48s after removing the remaining duplicated footer wordmark. Lint exit0, same8existing React warnings, no new warning.
- Browser matrix12/12: signed-in Home/guest Home-auth at320/390/768/1440; VI/EN at390/1440, VI at320/768. No horizontal overflow, page errors or nav regressions.
- Additional4/4detail cases at390/1440 VI/EN verify header/return/footer images decode to the correct asset and preserve640:521aspect ratio; footer screenshots inspect the mark on the dark surface. Final footer evidence recapture does not alter app code.
- All API requests intercepted before browser navigation using synthetic fixtures; no real cookies/accounts/DB/media accessed. Guarded test server used5174 and was closed after verification; no normal live sign-in service claimed.
- Manifest dimensions match actual PNGs, logo alpha checked, original-source hashes match, scoped diff check passed. Apple/PWA installation on physical devices and social-network crawler cache refresh are not verified. No claim of iOS/device notification delivery testing.

Logo task only: A4 and prior pending gameplay/local-mode decisions remain pending.
