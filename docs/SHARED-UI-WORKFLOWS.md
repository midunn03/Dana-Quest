# Shared UI and navigation

The desktop layout uses the available viewport with 20–48 px gutters and a 1600 px content frame. Main content uses 16 px text; supporting copy uses 14 px. White surfaces, neutral borders and the existing pink accent connect browsing pages. Gameplay retains its dark reading environment.

## Route ownership

- The five primary destinations remain Explore, Events, Search, My quests and Account.
- Account, its subpages, Library and Coin shop share `WorkspaceNavigation`. Desktop uses a 230 px rail; mobile uses a horizontally scrollable shortcut row above content, with the five main destinations below.
- Account editing, security, preferences and support return directly to Account. Saving remains on the current form with an explicit result. Settings is an index, never a required intermediate exit.
- Account's library preview uses the same quest covers and actual quest completion state as Library. Each cover opens that quest's details. Private uploaded photos are never presented as quest covers or published images.
- Coin shop returns to Account and links to My quests and redemption history. Category filtering retains existing redemption validation and confirmation. Legacy redeemable coins and quest coins remain separate; no automatic monetary conversion is introduced.
- Quest details → preparation acknowledgement → directions → visual arrival confirmation → play → completion → Explore or My quests. Desktop play includes a non-interactive progress rail; locked challenges remain locked. The map opens through the existing guide dialog.

## Map boundary

Only the old exterior Explore header was removed. Leaflet setup, tiles, markers, search, destination controls, route calculation and location logic are retained. Desktop directions places the map/content stage in a large left column, with preparation and confirmation in the right column. The legacy directions panel also occupies its own desktop column. Mobile keeps the existing compact directions flow.

## CSS ownership

Base and legacy styles load before page styles, so older generic rules cannot silently override newer page layouts. `Workspace.css` owns viewport layout, shared sizing and typography tokens. Page styles consume those tokens and own their internal grids. No dependencies or Django changes are required.

## Verification

`tests/workspace-browser.cjs` uses an isolated temporary account store, checks twelve routes at five viewport sizes, and exercises arrival, play and the in-game map. Account tests cover save staying on the same route and direct return. Existing game, currency, events and account tests remain regression checks. Browser testing simulates device sizes; it does not certify physical phone hardware.

The additional subpage browser check covers 25 account subpages plus character customization, creator and event details at desktop and phone widths. The gameplay regression completed all 16 quests at 320×568, 390×844, 844×390 and 1440×900 (64 runs), including all five DUE challenge types and reload persistence. A production build succeeded; lint retains only the existing AuthContext Fast Refresh warning.

Final unit/integration verification: 195 of 196 tests passed in the full run; the remaining long map → play → redemption integration test hit its former 20-second limit during concurrent browser work. With the integration test budget aligned to the other long flows (60 seconds), all seven flow tests passed on rerun. No assertions were removed. The two new coin-shop cases and shared navigation regression passed.
