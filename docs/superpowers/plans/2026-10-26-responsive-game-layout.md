# Responsive game layout implementation plan

**Goal:** Implement the mobile and desktop layouts approved in chat, preserving existing game behavior.
**Architecture:** Keep the same React pages and routes. Make MobileLayout.css the final shared layout layer; use viewport media queries, without device detection or duplicated gameplay.
**Tech stack:** Existing React, CSS, Vite and Leaflet.
**Spec:** User-approved responsive design in this chat, 26 October 2026.

## Constraints
Only presentation changes. Preserve colors, assets, authentication, storage, quests and rewards. No push or deployment.

## Tasks
- [x] Confirm baseline: desktop currently constrained to 390px.
- [x] Adjust shared shell, mobile safe areas, touch targets and desktop navigation; keep forms/story readable and map panels beside the map.
- [x] Verify mobile 360/390/430, landscape, desktop 1280/1440/1920, short heights and keyboard navigation. Check actual CSS viewport dimensions, overflow and visible controls.
- [x] Run build/lint; inspect diff for scope. Report any pre-existing failures separately.

## Review focus
Short landscape screens must scroll; navigation must not cover content; map attribution must remain accessible; portrait/landscape resizing must update the map; onboarding must not gain navigation or new behavior.
