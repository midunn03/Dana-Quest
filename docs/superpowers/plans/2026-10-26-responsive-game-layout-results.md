# Responsive layout verification — 26 October 2026

Base: 37c6ded0c9fe44c77e9f09fb8220fc8be3ed4ea5. Branch: ui/responsive-game-layout.

App changes: shared responsive CSS and CSS import order only. No game, API, account, photo, reward or progression logic changed. Development review harness: tests/responsive-layout.html, excluded from the production entry/build.

## Results
- Build: passed (`npm.cmd run build`).
- Lint: completed without errors; three existing warnings in AuthContext.tsx and useLiveVisitInfo.ts, untouched.
- Diff whitespace check: passed.
- Browser: map and album measured in exact CSS iframe viewports 360×800, 390×844, 430×860, 844×390, 1280×720, 1440×900, 1920×1080. No horizontal overflow of main content. Mobile navigation below content; desktop navigation above.
- Shop, Account, Avatar and Quest detail: checked at 360×800, 844×390 and 1440×900. No horizontal overflow; short-height pages scroll.
- Login: checked at 360×800, 844×390 and 1440×900; navigation hidden, no horizontal overflow, short-height form scrolls.
- Destination panel: search opens Cầu Rồng; mobile preview ends above navigation; desktop panel is 380px wide at the right. ArrowUp expands; desktop map remains visible.
- Main tab captured console error list: empty at inspection. This is not proof that external resources load.
- Synthetic local account layout-test-20261026 used for verification and logged out afterward. No quest started, reward redeemed or private user data accessed.

## Limits
OpenStreetMap tiles reported a network load failure. Fallback message/links remained accessible. Tile service, Python backend and gameplay were not changed. These are browser viewport checks, not physical phone, OS keyboard, camera/GPS or complete accessibility certification. Browser zoom affected viewport overrides; exact mobile sizes were therefore checked using same-origin iframes in the development harness.
