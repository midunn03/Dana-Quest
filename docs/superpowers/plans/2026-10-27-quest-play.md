# Quest play implementation

User requested actual gameplay based on grouped Questo play screenshots and Dana Quest specification. User explicitly chose correct-answer-only, existing rewards. No skip, paid hints, answer reveal, countdown, teams, fabricated audio or new historical facts.

Implement the existing two-checkpoint DUE quest first: white briefing, existing start-navigation route, immersive dark story -> challenge -> saved feedback -> next story -> summary. Mint-green actions, compact progress/XP badges, menu, pause/resume, reading help and sources. Mobile single reading column; desktop route overview plus bounded story/challenge column. Hide global navigation only during play. Artwork labeled illustration because no verified DUE reference photo exists in the current public library.

Persist runs on authenticated server with authoritative answers/order/rewards and idempotent operations. Preserve old device saves without automatically attributing them to an account. Sample XP/coins remain a separate quest balance rather than silently mixing with legacy shop funds. New account runs cannot be read/written by other accounts. Failed loads and corrupt saves must remain errors, never reset-and-overwrite.

Keep legacy reducer/data compatible. Extract existing quest metadata unchanged into a shared JSON catalogue. Run stage persistence enables reload on feedback, pause and challenge; wrong/network/storage errors do not unlock the next checkpoint. Add focused state/storage/API and component tests before implementation, then full tests, build/lint, and browser interactions/geometry on mobile and desktop. Do not push.
