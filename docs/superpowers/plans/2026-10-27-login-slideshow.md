# Login scenery loop

Removed the generated magnifying-glass logo and wordmark; reserved an empty responsive logo slot. Reused the existing destination image library and credits for APEC, Dragon Bridge, Han River Bridge, Linh Ung Bai But and Hai Van Gate, in that order. No external services or dependencies.

Each photo starts every 20 seconds; opacity crossfade lasts 1.6 seconds, with the preceding photo kept opaque underneath to avoid a blank frame. Only loaded photos can become active. Failed photos are skipped. Autoplay pauses when the page is hidden or the user pauses it, and stays static for reduced-motion preference. Timers and preference listeners clean up on unmount. Visible credit follows the active destination. Login API and game functionality remain unchanged.

Verification: test-first failures reproduced missing placeholder and multi-photo loop. Three slideshow tests passed (100-second loop, pause/resume, failed/unloaded photos, reduced motion and hidden tab). Eight existing login/modal tests passed. Build passed; lint only reports the three pre-existing warnings. Chrome clock-driven checks passed at 390x844 and 1440x900 for all five transitions, loop, opacity completion, pause, empty logo slot, no horizontal overflow and no page errors. Screenshots: tests/visual/login-slideshow-390.png and login-slideshow-1440.png. No GitHub push.
