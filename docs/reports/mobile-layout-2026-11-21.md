# Mobile layout — 2026-11-21

Scope: mobile-only homepage layout, shared mobile header and bottom navigation styling, discovery card typography and event list/filter layout. Existing desktop styles and application/device-switch handlers unchanged. Other game and account page structures remain unchanged.

Homepage: vertical photo and auth form, local search slot reusing the same search destination, existing MainNavigation reused in a phone-only dock, 44px minimum header controls, stacked content and reward/FAQ areas, mobile quest slide widths, local DUE photo retained. No new business behavior or backend edits.

Shared phone presentation: original brand logo replaces plain mobile header text, consistent blue/mint/cream styling; event lists and filters use one column even when phone mode is selected on a wide desktop. Existing next-step suggestion moved into layout flow so it no longer covers inputs. All original links and action handlers retained.

Verified in the browser phone-mode preview (~436px content width): search and five homepage dock destinations present, hamburger open/close, quest navigation, register tab, events and discovery routes, no horizontal overflow. Switched back to desktop and confirmed phone-only search/dock hidden and hero uses the original grid. No physical handset was available; safe-area and keyboard behavior still require hardware validation.

Screenshot: homepage-phone-layout.jpg. Shared login backdrop/homepage action block and App route/device/auth code compared against the task baseline, excluding only added style imports and mobile logo markup.
