# Quest answer exposure — inventory and decision proposal

Date: 2026-10-31. Group A4 is documentation only. No catalog, answer, gameplay, ID, storage key or reward was changed.

## Confirmed import paths

| Location | What enters or uses the client bundle | Needs secret answers? |
| --- | --- | --- |
| `src/data/quests.ts` | Static imports of `src/data/questCatalog.json` and `src/i18n/questContent.en.json`; locale-aware `quests` proxy and `getQuest` return complete challenge objects. Type `QuestChallenge` includes answer fields. | Display consumers need public content, but currently receive answers too. Both language catalogs must be sanitized. |
| `src/lib/questProgress.ts` | Imports `getQuest` and `isChallengeCorrect`/`migrateCatalogRun` from `shared/quest-challenges.mjs`. `updateQuestProgress` grades `complete-checkpoint` locally. `validateQuestRun`/migration need checkpoint order and catalog version, not answers. | Yes for local grading; no for migration/structural validation. |
| `src/lib/useQuestProgress.ts` | Without an account owner: reads/writes `dana-quest-progress-v2` and calls `updateQuestProgress`. With an owner: sends actions to `/api/auth/quest-runs`, then validates returned progress. | Device mode needs the local grader today. Account mode does not need secret answers to grade, but imports the same module graph. |
| `src/QuestPlayPage.tsx` | Imports `getQuest`, `ChallengeInput`, `useQuestProgress` and shared `challengeAnswerReady`. Dispatches answer strings; does not directly call the correctness grader. | Rendering/readiness only needs public challenge data. Shared module also contains the grader, whose export is reachable through local progress. |
| `src/ChallengeInput.tsx` | Renders options, ordering items and matching pair IDs/labels; matching currently receives full `pairs` objects. | No: `pairs[].id`/`label` are public, `pairs[].correctOptionId` is private. Do not remove all `pairs`. |
| `src/i18n/locale.ts` | `unlocalizedKeys` preserves `acceptedAnswers`, `correctOptionId`, `correctOptionIds`, `correctOrder`. | Translation exclusion does not remove data from the bundle. |
| `server/quest-runs.mjs` | Reads the full Vietnamese JSON directly and imports the shared grader; validates checkpoint sequence/answers and awards server-side. | Yes, server only. Existing server authority does not prevent users reading client answers. |

Source verification used searches for `questCatalog`, `questContent`, `isChallengeCorrect`, `acceptedAnswers`, `correctOptionId`, `correctOptionIds`, `correctOrder` in `src/`, `shared/`, `server/`. The production build still emits a `quests-*.js` chunk containing the catalog. Minification and lazy loading do not provide confidentiality.

## Fields and grading

| Challenge type | Answer-bearing fields / rule | Public fields to retain |
| --- | --- | --- |
| text | `acceptedAnswers[]`; normalized text comparison | prompt, placeholder |
| single-choice | `correctOptionId` | prompt, options IDs/labels |
| multi-select | `correctOptionIds[]` | prompt, options IDs/labels |
| ordering | `correctOrder[]` | prompt, items IDs/labels |
| matching | `pairs[].correctOptionId` | prompt, pairs IDs/labels, options IDs/labels |
| observation | Shared rule accepts literal `confirmed`; no hidden answer field | prompt, confirmationLabel |
| photo | Shared rule uses `photoAvailable`; current `ChallengeInput` renders an unconfigured notice. Node quest-runs calls the grader without `photoAvailable`, so this type cannot pass there currently. | prompt; do not change evidence requirements in this proposal |

Story, hints and feedback can themselves reveal answers. A catalog split prevents direct key exposure, not inference from intentional clues. Review feedback delivery separately without stripping useful public story content automatically.

## Local, legacy and account distinction

- Current device-only **v2 quests** actively require secret answer fields for local grading. Removing fields now breaks that mode. Browser-only progress can also be edited by the device owner; it cannot become authoritative merely by hiding fields.
- The nested `legacy` v1 destination/mission state is migrated by `migrateQuestState` through `readState`; its self-confirmation/GPS/photo mission workflow in `src/lib/progress.ts` does not use this quest-answer catalog. Do not confuse preserving old destination progress with preserving offline v2 grading.
- Account quest actions are graded by Node `/quest-runs`; account clients still import the local-capable graph. Django currently lacks `/quest-runs` and `/quest-codes`; this audit does not implement backend parity or choose a backend.
- English display records contain parallel answer fields. The server reads the Vietnamese catalog; accepted-answer localization parity needs explicit regression coverage during a future split. Do not silently modify accepted answers now.

## Proposed implementation after approval

1. Keep a full server-only catalog as the authoritative source. Generate a public projection with the same IDs, order, version, rewards and display content, dropping only private answer keys at their actual nesting levels. Generate both language projections.
2. Separate public challenge types/readiness/migration helpers from the server grader. Ensure browser import graphs cannot reach the full catalog or `isChallengeCorrect` after the local-mode decision.
3. Preserve the current action API and server-side guards. Account clients render the public projection and display grading feedback returned by the server. Do not trust client-supplied correctness or reward values.
4. Add projection/parity tests, unchanged reward/sequence tests, every challenge type in VI/EN, legacy migration tests and a build-artifact check that known answer fields/full catalog are absent. Test representative answer values too; key-only scans are insufficient.
5. Roll out without deleting old device records. Document migration/export policy and recovery before disabling device play. No automatic merge of untrusted local completions into authoritative account rewards.

## CẦN CHỐT — owner decision required

**Recommended:** require account/server grading for new v2 quest play, preserve existing device records for read/export, and decide their transition explicitly. This allows secret answers to leave the production client bundle.

Alternative: retain fully offline/device v2 play. Then its grader needs answers locally, so the offline distribution cannot promise answer secrecy. Isolating it in a separate build can keep the account build clean, but users can still inspect the offline answers.

Please decide whether to retain or retire device-only v2 quest play, and how existing local progress should be presented. No implementation of this split is approved or included in group A.
