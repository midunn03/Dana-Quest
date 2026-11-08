# Login and navigation refresh

Goal: follow the supplied Questo screenshots for login, discovery and five navigation items on mobile and desktop while preserving Dana Quest functionality.

Approach: reuse React, hash routing and existing authentication/progress APIs. Mobile has a pill navigation bar and raised search button. Desktop has a horizontal header and wide card grid. Login is a rounded white panel over Dana imagery with the existing working username/password form. No social login placeholders.

Scope: AuthPage presentation; main navigation; discovery list and map switch; search; joined quests. Album and rewards remain linked from Account. Gameplay, persistence, authentication contracts, events, maps and rewards are preserved. No GitHub push or main branch changes.

Implementation:
- Add behavioral tests for five navigation destinations, accent-insensitive search, joined quests and account utilities.
- Add dedicated navigation and discovery components, using real destination/quest data and existing progress hooks. Preserve all map aliases except the requested discovery landing page.
- Style login and navigation with white panels, warm neutral outlines and the pink active/search treatment from the reference; keep Dana assets. Use mobile bottom navigation and desktop top navigation, readable forms, visible focus and safe-area spacing.
- Run focused tests, existing suite, build and lint. Verify browser layout and interactions at phone and desktop sizes where tooling permits.

Review: empty and failed progress loads must not imply successful results; no fake ratings or pricing; search routes must retain keyboard access; no content hidden under navigation; local quest progress must be identified as device data.
