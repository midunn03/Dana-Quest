# Official Dana Quest logo integration Implementation Plan

> Execute inline. User requests replacing system logo locations with the supplied logo and requires this plan before edits. No commit/push is implied by this new request.

**Goal:** Use the user's official pixel-art logo consistently in the application and app/site identity assets without changing gameplay.
**Source:** `C:/Users/Admin/Desktop/5fab39f6-0559-4598-9f97-ec5bc9328a86.png` (1536×1024, RGB, opaque checkerboard background).
**Architecture:** Keep original provenance, create a transparent cutout without redesigning the lettering/art, and centralize visible logo rendering through the existing PixelLogo component. Use correctly proportioned contained images; small app identity variants must retain the official artwork. Public URLs respect BASE_URL.

## Constraints
- Preserve supplied logo colors/shapes/lettering. Do not recolor it to the green UI palette, stretch or crop off letters/map/pin. No font/gameplay/routes/API/storage/GPS/camera/DB changes.
- Use imagegen for background removal/bitmap variants; no ad-hoc Python image edits. Inspect generated result and reject if the brand lettering/art is altered materially.
- Do not access .data/secrets/real DB/media. Browser checks use intercepted synthetic API fixtures. No dependency additions or unrelated cleanup.
- Existing old logo files are not deleted before checking references/tests. Do not change textual mentions of the game in content into images.
- No Git push/commit in this task; previous push request was completed already.

## Inventory and tasks
- [x] Prepare original copy and transparent asset under public/brand/. Verify alpha/background and visual fidelity. Prepare standard PNG app icons and1200×630 sharing composition through image tooling if necessary; preserve full artwork with safe padding.
- [x] Update src/PixelLogo.tsx and its owned CSS as the shared official image renderer (decorative by default, parent links retain accessible name).
- [x] Update WelcomePage header/footer/return card and LandingBackdrop logo slot; remove duplicated DANA/QUEST wordmark text where the official image already supplies it. Update existing CSS sizing at the original rules, not a tail patch.
- [x] Check DestinationPage's brand/home link and other actual logo uses; keep ordinary game-name copy and game artwork unchanged.
- [x] Update index.html favicon/apple-touch/share references, public/manifest.webmanifest app icons and pageMetadata sharing URL consistently. Update service-worker cached identity reference/version only if it still points at an old brand asset; preserve all fetch/offline/notification behavior.
- [x] Add focused regression for logo URL/accessible link and unchanged home navigation as appropriate; preserve existing expectations. Run build/full tests/lint and inspect390/1440px VI/EN plus320/768 overflow. Confirm no remaining live old brand asset references.
- [x] Record changed/new files, checks and any remaining limitation in docs/OFFICIAL-LOGO-INTEGRATION.md. Stop after logo task; A4 remains pending.

## Review focus
- Uploaded checkerboard is baked into RGB pixels; an untouched copy is not a transparent production logo.
- Tiny favicon/app icons must remain centered and not crop text/map/pin; inspect rather than assume generated dimensions.
- Header must not regain the320px overflow fixed in group F. Footer on dark surface needs transparent artwork and sufficient outline separation.
- OG/Twitter dimensions/URL and PWA icon type/sizes must match actual assets; browser/PWA caches must not retain an old identity reference.
- Existing tests may intentionally locate the Home link by its accessible name; preserve names and links.
