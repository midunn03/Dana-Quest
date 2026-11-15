# DaNa Quest — bright pixel system, green v2.2

The coast is open, sunny and inviting. Clean readable surfaces occupy about 80% of each screen; original pixel art, stepped edges, short labels and rewards supply the other 20%. A single expressive illustration may lead a page. Controls and player information stay quiet and readable.

## Tokens

`src/ExperienceTokens.css` is the single token source. The owner approved green v2.2 on31/10/2026 in docs/TASKS.md. Screen CSS consumes semantic `--px-*` roles. Historical color names used by artwork resolve to these roles in the token file; screen CSS has no competing `--dq-*`, `--quest-*`, `--qd-*` or `--ap-*` palette.

| Role | Color |
| --- | --- |
| Ink / muted copy | `#1E302A` / `#52665C` |
| Primary actions / hover | Forest `#216447` / `#194D37`, white text |
| Selection / soft surface | `#E4F0E5`, dark ink |
| Success / progress | Forest `#216447`; soft status background `#E4F0E5` |
| Coast / information | `#28657C` |
| Rewards / coins | Gold `#D5A13A`, dark ink |
| Warning / error | `#A83732`, accompanied by text/icon |
| Focus | `#1F6080`,4px outline with offset |
| Page / surface | `#F7F5EC` / `#FFFFFF` |

Use dark ink on light/soft/gold surfaces and white on solid forest actions. Secondary/ghost controls retain dark text. Focus and hover must visibly change without relying on motion. Artwork and original logo assets keep their intentional illustration colors; no global recoloring of SVG/photo assets. Optional gameplay dark tokens do not enable dark mode across the app.

## Type and spacing

Vietnamese UI uses self-hosted Tiny5 Regular. English UI and explicit lang=en labels use Game Paused when a licensed webfont is supplied; currently the authorized self-hosted Pixelify Sans Bold fallback supplies the English outlines. Both CSS faces expose weight 400, font-synthesis is none, and monospace is the final fallback. Typography comes only from --font-vi/--font-en/--font-ui in ExperienceTokens.css. Existing --px-font* refer to the current language context.

Use fixed 24/32/40/48/64/80px type steps (96/112/144/176px only for existing decorative displays). Default prose, supporting UI and inputs are 24px for Tiny5 readability, with 1.8 prose leading and .04em tracking. Responsive changes use media queries. Vietnamese headings, controls and navigation use CSS uppercase; user-entered text and prose retain their content. Quest reading defaults to 24px and offers 24/32/40px via the existing presentation control. The canonical navigation height is 80px desktop and 112px mobile plus safe area, allowing two-line 24px labels.

Use the 4px spacing grid: 4, 8, 12, 16, 24, 32, 48, 64px. Main content stays near1280px, with at least20px mobile gutters. Forest is the dominant action accent; gold is reserved for rewards and information blue is secondary. All targets are at least44px high.

## Edges and elevation

No soft radii, blurred shadows or smooth gradients. Borders are4px ink; shared pixel controls may add4px side steps. Hard downward shadow has three levels: low4px,mid8px,high12px. Flat surfaces omit the shadow. Leave8px horizontal room for the step. Focus uses a4px blue outline with an offset on the light surrounding surface so it remains identifiable.

## Shared primitives

Import from `src/ui/PixelUI.tsx`; styles load automatically. Named `Pixel*` exports also have short aliases.

| Component | Contract |
| --- | --- |
| Button | Native button props, `variant=primary/secondary/ghost/danger`, `size=sm/md/lg`, `loading`. Disabled/loading blocks duplicate activation. Default type is button; forms explicitly use submit. |
| ProgressBar | `value`, optional `max`, required accessible `label`. Clamps unsafe/out-of-range values, segmented green fill. |
| Toast | `tone=info/success/error`; polite status by default, error alert. Owner determines lifetime. |
| Accordion | Native details/summary, `title`, children, optional `open`; works with keyboard and without script. |

Existing semantic UI may use the equivalent `.px-*` CSS classes without replacing business handlers. Preserve navigation links as anchors and native control semantics.

Card/Badge/Modal/Input/Tab/Tooltip are not PixelUI component exports. Existing domain cards/forms/dialogs remain owned by their screens; shared `.px-modal` styling is still used by ConfirmDialog and PlayerDialog and must not be deleted as an unused component.

## Icons and illustrations

The official game logo supplied31/10/2026 is rendered by `PixelLogo.tsx` from `public/brand/dana-quest-logo.png`. Preserve its yellow/green lettering, map, red pin and navy outline; do not rebuild the wordmark with fonts or recolor it to UI tokens. Header/footer, PWA/favicons, notification icon and sharing image derive from the same transparent master. Provenance and checks: `docs/OFFICIAL-LOGO-INTEGRATION.md`.

`PixelIcons.tsx` contains original 16×16 icons: pin, star, gift, lock, compass, map, xp, coin. Render at integer multiples of 16 (16/32/48/64); default size is 32px. SVG uses crisp edges. Decorative icons are hidden from accessibility; meaningful standalone icons need a title or labeled parent button. Never redraw icon details with arbitrary fractional coordinates. Raster art uses `image-rendering: pixelated`.

## Motion

Animate only transform and opacity. Button lift is 3px; press is 3px downward, duration 160ms with `cubic-bezier(.2,.8,.2,1)`. Modal/toast reveal is 12px over 180ms. Loading spinner uses eight steps. XP fill scales from its left origin, preserving layout. Native accordion content has a short opacity/translation entrance; no animated layout height. Avoid perpetual decoration, keep effects local to user actions, and pause any page-owned loops when out of view. Reduced motion removes transforms, transitions, entrances and spinners while preserving visible busy state and all functionality.

## Review checklist

Check VI/EN at 390, 768, 1280px and wide desktop. Inspect visible labels, native keyboard activation, focus, native modal dismissal and focus restoration, disabled/loading actions, long copy, empty/error states and reduced motion. Use actual game data; never manufacture player counts, points or rewards. Shared primitives contain no auth, storage, API or game logic.
