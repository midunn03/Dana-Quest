# Login reference refinement verification

Read all seven images IMG_6803–6809 in reference-review-20261026/Ảnh màn hình Questo-20261027T015120Z-1-001/Ảnh màn hình Questo/Login page.

WelcomePage and AuthPage now implement the welcome -> choice sheet -> working account form structure from IMG_6803/6804. Used the existing APEC photo with its existing author credit. Removed the previous split-screen auth styling. On mobile the sheet is bottom aligned; desktop centers the bounded panel. Registration, avatar redirect, password login and existing session API remain intact. Other product features are unchanged in this revision.

Intentional differences reported to the user before implementation: no Apple/Google integration, external booking activation, city-selection or preference onboarding. Those require separate functionality. No invented reviews, sales metrics or inactive legal links. No backend, data model or gameplay changes.

Validation:
- New login-sheet tests reproduced absence of dialog before implementation, then passed for choice/form flow, keyboard focus containment, Escape close, login error with retained values and register/login switching.
- Full suite: 29 files and 139 tests passed.
- Final npm run build passed. Lint passed with the same three existing warnings in AuthContext and useLiveVisitInfo.
- Chrome headless: 35 stage/viewport checks passed at 320x568, 360x800, 390x844, 430x860, 844x390, 1280x720 and 1440x900. No horizontal overflow or sheet outside viewport. Tested welcome, choice, form, failed login and registration, password visibility, back/close/Escape and focus. No pageerror events. Reduced-motion mode enabled.
- Browser network fixtures remained in isolated contexts, made no real account or progress changes, and are not evidence of live external service availability.
- Reviewed screenshots in tests/visual/login-reference-{welcome,choice,form,error,register}-{390,1440}.png. Geometry output in tests/visual/login-reference-results.json.
- git diff --check passed. No push/commit; current branch ui/responsive-game-layout.

Limitations: browser viewport emulation rather than a physical phone or OS keyboard; no provider sign-in, real camera/GPS or booking integration tested. Authenticated users still redirect away from login by the existing routing rule; logout first to see the welcome/login flow in the normal browser session.
