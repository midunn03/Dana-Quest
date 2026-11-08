# Onboarding completion results

Implemented the six supplied reference stages and branching links: welcome -> login sheet -> activated/code options -> city -> plans -> intro -> Explore. Welcome booking card, login yellow card, already-activated, have-code, no-code, city booking link, plan skip, back links and legal-information links have destinations. Email/account login is functional; social providers remain outside the agreed scope. No external platform purchases are claimed.

New registrations go through custom avatar then city, or return to code entry if initiated there. Returning accounts retain direct discovery access. Removed preset selection, arrows and preset fallback controls from AvatarPage; preserved the preview and all custom shape/hair/clothing/color controls plus randomization. Existing preset IDs remain readable for older accounts. Server now validates and accepts custom c1 codes, matching current client enums and palette lengths; invalid values remain rejected.

City is a real searchable Da Nang choice with current catalogue count, not an invented multi-city catalogue. GPS is requested only when the explicit location button is pressed, with denial/outside-city feedback. Plans are persisted in this browser and described as such. Introduction ends at Explore, which now permits guest browsing; gameplay/private pages still require login.

Real code system: owner CLI npm run codes:create, random 96-bit code, hash-only storage, future expiry validation, exclusive file locking shared by CLI/server, single-account redemption, idempotent retry and account-scoped list. HTTP issuance is absent. Redemption rate limited; session and existing origin protections apply. Activated quests appear in the Quest page without fabricating mission progress, payments or rewards. Owner instructions are in docs/QUEST-CODES.md.

Verification:
- Full test suite: 32 files, 144 tests passed. Includes real HTTP auth/custom-avatar/code integration and code ownership, expiry and concurrency tests in temporary stores.
- Build passed. Lint has no new warnings, only three pre-existing AuthContext/useLiveVisitInfo warnings.
- Chrome journey check: 42 page/viewport geometry checks across 360x800, 390x844, 430x860, 844x390, 1280x720, 1440x900 and 1920x1080. Full guest, GPS (synthetic location), registration/customize, return-to-code, error/success and activated-list workflows passed. No page errors or horizontal overflow. Fixed legacy flex-centering that prevented scrolling custom controls in landscape.
- Browser API fixtures used isolated sessions and did not change real user accounts. Backend behavior was tested separately through actual HTTP requests.
- Screenshots in tests/visual/journey-*.png reviewed against references. Metadata in journey-layout-results.json. Diff whitespace check passed.

Limitations: physical device/camera/GPS field testing not performed; plan preferences currently browser-local and do not drive a recommendation engine. City content is Da Nang only. Code administration is a local command rather than a web admin page; storage targets the existing single-host Node deployment. No push or commit.
