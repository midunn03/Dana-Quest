# Bright pixel screen inventory

Audited from `src/App.tsx` and component CSS imports, 28 October 2026. Presentation changes preserve existing routes, handlers, requests, progress, wallet, and authentication operations.

| Screen / state | Route or component | CSS ownership |
| --- | --- | --- |
| Public introduction + embedded sign-in / registration | `/`, legacy `/dang-nhap`, `/dang-ky` | `HomePage.css`, `LoginExperience.css` |
| Authentication checking, fallback, validation errors | `AuthPage`, app suspense / auth guards | `Auth.css`, `App.css`, `LoginExperience.css` |
| City, journey plan, how to play | `/bat-dau/thanh-pho`, `/bat-dau/ke-hoach`, `/bat-dau/gioi-thieu` | `JourneyOnboarding.css` |
| Activate quest / enter code | `/kich-hoat`, `/nhap-ma` | `JourneyOnboarding.css` |
| Terms and privacy information | `/dieu-khoan`, `/quyen-rieng-tu` | `JourneyOnboarding.css`, `Discovery.css` |
| Discover, search, joined quests and guest prompt | `/kham-pha`, `/explore`, `/tim-kiem`, `/quest-cua-toi` | `Discovery.css`, `QuestPlayer.css` |
| Main navigation and responsive application viewport | `MainNavigation`, app shell | `App.css`, `Discovery.css`, `MobileLayout.css`, `Workspace.css` |
| Destination / event map, filters, location states, nearby drawer | `/map`, `Explore`, `NearbyDrawer` | `Explore.css`, `MapCompact.css`, `NearbyDrawer.css`, `MobileLayout.css` |
| Quest briefing, missing quest and creator information | `/quest/:id`, `/nha-sang-tao/:id` | `QuestPlayer.css`, `QuestDetail.css` |
| Quest directions / start / live map | `/quest/:id/chi-duong`, `DueStartPage`, `DueMap` | `QuestPlayer.css`, `DueExperience.css`, `NavigationPage.css` |
| Quest story, answers, choice / observation, result, help, menu, support, completion | `/quest/:id/choi`, `QuestPlayPage`, `PlayerDialog` | `QuestPlayer.css`, `DueExperience.css`, `ui/PixelUI.css` |
| Destination details, mission list and check-in | `/dia-diem/:id`, `/nhiem-vu/:id` | `Quest.css`, `GameVisual.css`, `TravelVisual.css`, `MobileLayout.css` |
| Legacy destination directions / arrival | `/chi-duong/:id`, `NavigationPage` | `NavigationPage.css`, `GameVisual.css`, `MapCompact.css`, `MobileLayout.css` |
| Camera permission, capture, photo preview, submission, failure | `/may-anh/:id/:mission`, `CameraCapture`, `PhotoMission` | `Quest.css`, `GameVisual.css`, `MapCompact.css`, `MobileLayout.css` |
| Mission celebration / coins | `/hoan-thanh/:id/:mission` | `GameVisual.css`, `TravelVisual.css` |
| Avatar selection / editing | `/chon-nhan-vat`, `/nhan-vat` | `Onboarding.css`, `AvatarCustomize.css`, `GameVisual.css`, `TravelVisual.css` |
| Quest cover library, filters, empty state, old photo deletion | `/album`, `AlbumPage` | `QuestLibrary.css`, `Workspace.css` |
| Coin shop, categories, reward cards, vouchers, redemption confirmation | `/cua-hang`, `ShopPage` | `Quest.css`, `CoinShop.css`, `Workspace.css`, `ConfirmDialog.css` |
| Events index, filters, details, saved events, notification | `/su-kien`, `/su-kien/:id`, `EventProvider` | `Events.css` |
| Profile, passport, XP, quest / photo history, badges and rank view | `/tai-khoan`, `AccountExperience` | `AccountReference.css`, `Quest.css`, `Workspace.css` |
| Account profile / security / sessions / wallet / preferences / language / cache / restore / deletion | `/tai-khoan/:view`, account subviews | `AccountReference.css`, `Workspace.css`, `ConfirmDialog.css` |
| Shared confirm / cancel / destructive / busy state | `ConfirmDialog` | `ConfirmDialog.css`, `ui/PixelUI.css` |
| Notifications, errors, empty / loading states, active mission indicator | `Notifications`, shared page states | `App.css`, owning page CSS, `ui/PixelUI.css` |
| Unknown route / 404 | app route fallback | `Quest.css`, `GameVisual.css`, `MobileLayout.css` |

## Shared visual contract

- All active screen styles refer to shared `--px-*` colors, body typography, borders, and hard elevation tokens. Legacy local color variables alias those shared tokens.
- Existing layout, breakpoints, safe areas, map height, overflow, and route handlers remain at their current ownership sites. Appearance is migrated in those declarations, without a late blanket `!important` theme.
- Shared notifications use `PixelToast`; confirm/player dialogs and actions use the shared modal/button class contract. Existing forms, cards and tabs keep their semantic HTML and existing handlers while consuming the same tokens at CSS ownership. Profile XP uses the shared segmented PixelProgressBar with the same value and maximum.
- Body copy remains readable Vietnamese typography. Pixel typography belongs to short English / numeric labels. Touch controls retain a minimum 44px size; focus uses the yellow pixel outline. Profile progress retains its accessible value and receives the green, segmented treatment.
- Coral is reserved for destructive / warning states and map pins. Photographic quest covers remain real images; generated SVG artwork uses the shared palette.

## Legacy stylesheet disposition

`GameVisual.css`, `TravelVisual.css`, and `MapCompact.css` previously mixed obsolete appearance with essential mission, camera, map-sheet and responsive layout. Their old colors, soft corners, gradients, blur and soft shadows were replaced at source. **Keep their imports for this migration**: removing them outright would discard functional layout. A later layout-only extraction can rename/consolidate these files with screenshot coverage.

`pixel.css` is an unimported older UI kit with a conflicting teal/brown `--px-*` palette. It is obsolete; active components use `ExperienceTokens.css` and `ui/PixelUI.css`. It must not be imported into the new theme. `Account.css` is a compatibility import of `AccountReference.css`.

## Verification limits

This inventory records source coverage, not a claim of live authenticated workflow completion. The implementation report must distinguish build/tests and guest browser checks from account-dependent flows that require a real session, permissions, location, or camera hardware. Existing real photos / maps and server-provided media are not recolored by the CSS migration.

