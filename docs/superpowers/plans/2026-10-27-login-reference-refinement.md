# Login reference refinement

Source: grouped Login page IMG_6803–IMG_6809 in the user's new reference-review folder. The first two images define a full-screen welcome and a modal bottom sheet, not a permanent split-screen login form.

Implement the welcome/photo composition and choice sheet, followed by the working username/email and password form. Keep existing login/register API and avatar redirects. Mobile sheet is bottom aligned with internal scrolling; desktop sheet centered and bounded. Close, back, Escape, focus containment, errors, busy state and password visibility are verified. Keep Dana photos and copy; no fabricated review metrics.

User was informed before implementation: Apple/Google sign-in, external booking-code activation and the city/plans onboarding screens are additional functionality absent in the project. Do not add fake controls, purchase flows or provider integrations. Current scope is welcome/login/register only; no changes to quests, navigation, persistence or gameplay. No push.

Checks: new modal behavior tests first; existing authentication and complete suite; browser views at small/large phones, landscape and desktop; screenshots reviewed against the two references. Test busy/error/retained values, password toggle, closing and registration.
