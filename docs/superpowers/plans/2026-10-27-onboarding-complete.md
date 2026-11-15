# Complete reference onboarding and custom avatar

User authorized the six-image flow, small underlined navigation links, custom-avatar-only UI and real Dana Quest-issued codes. No social login or third-party booking integration.

React hash routes: welcome -> account choice; activated/booking branch -> account login or code entry or city browse; city -> plans -> introduction -> Explore. Guests can browse Explore, map, search and quest/place details; gameplay and account data still require login. New accounts customize before city onboarding; returning accounts with avatars keep their direct Explore entry. Guest plan choices are local to this browser, with no fabricated recommendation engine.

Files: OnboardingPage/CSS and local preference helper; BookingPage and client code API; server activation store plus local-only issuer command; AuthPage/Welcome/App link integration; AvatarPage/CSS and server custom-avatar validation. Preserve old avatar IDs for existing accounts while removing preset selection from the UI.

Code issuance is a local owner CLI, never a public issue endpoint. Random codes are hashed at rest, single-account redemption, expiry checks, same-account retries idempotent, account-scoped entitlement listing. Codes attach existing quests, do not fabricate payment or progress. Game remains playable as before without paywalls. Store is designed for the existing single Node server; cross-process issuance/redemption uses an exclusive lock.

Tests first for onboarding persistence, real code issue/redeem/replay/concurrency/isolation and custom avatar persistence. Then full tests, build/lint and Chrome flow/layout checks at mobile and desktop sizes. No push, no main branch edits, only authorized folder.
