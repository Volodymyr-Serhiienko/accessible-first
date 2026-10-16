# Style System

Accessible First provides global, opt-in framework CSS through
`packages/components/src/styles/index.css`. It supplies the baseline needed to
assemble ordinary pages and application interfaces without recreating common
layout, control, focus, theme, or responsive rules in every project.

```ts
import "../../packages/components/src/styles/index.css";
import "./styles.css";
```

Import application CSS after the framework stylesheet.

## Ownership Boundary

The library owns reusable defaults:

- page, header, navigation, main, footer, and contained-layout baseline;
- composition layouts, readable text flow, and responsive width constraints;
- native control presentation, 44px interaction targets, focus indicators, and
  disabled states;
- light and dark themes, semantic status colors, reduced motion, and the
  forced-colors fallback;
- stable component data attributes and CSS custom properties.

Application CSS should own product identity and genuinely product-specific
layouts: branding, content illustrations, a learning screen, analytics charts,
or a business-specific dense table. Do not copy framework defaults into an app
stylesheet. When a visual rule repeats across the playground, templates, or two
real applications, evaluate it for promotion into the library.

The baseline treats vertical spacing as a property of the parent composition rather
than an accident of browser margins. `Section` separates a heading and its ordinary
content with `0.75rem`; `Panel` has the same direct-child rhythm; `Stack` separates
larger blocks with `1rem`. Use the `gap` option on these primitives when a specific
screen needs a denser or looser layout, instead of adding ad hoc margins to buttons,
tables, or headings.

Single-column content grids use `minmax(0, 1fr)` so percentage-bounded children do
not expand the implicit track under text enlargement. This applies to Stack,
Panel, Section, Screen, cards, forms, disclosures, tabs and overlay content,
including internal content grids. Panel/Section text and table labels wrap unbroken strings;
Stack does not automatically wrap arbitrary raw text. Deliberately fixed-width
content still needs an application-owned overflow policy.

### Hidden Content

AF roots marked with `data-af-component`, `data-af-composition`, `data-af-layout`
or `data-af-page` preserve native `hidden` display even when their normal layout
is flex or grid. Remove the attribute to reveal the component; `hidden="false"`
still hides content. Internal Menu items, Listbox options and tab buttons use the
same rule. It is scoped to those AF roots/items, not unrelated author markup.

The rule excludes `hidden="until-found"` so it does not prevent the browser's
find-to-reveal behavior. That state requires native browser support and is not
a compatibility fallback for older browsers; reserve it for supported document
content, not as a replacement for a widget's open/close API.
[HTML hidden states](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute).

## Tokens

All framework colors are theme tokens. Applications may override them on
`:root`, a theme root, or a local screen boundary.

Core layout tokens:

- `--af-font-family`
- `--af-target-size`
- `--af-focus-ring-width`
- `--af-focus-ring-offset`
- `--af-radius-sm`, `--af-radius-md`
- `--af-space-1` through `--af-space-6`

Core colors:

- `--af-color-bg`, `--af-color-fg`, `--af-color-muted`, `--af-color-border`
- `--af-color-primary`, `--af-color-primary-fg`
- `--af-color-link`, `--af-color-link-visited`
- `--af-color-focus`, `--af-color-disabled-bg`, `--af-color-disabled-fg`

Status colors are shared by Badge, StatusMessage, Progress, Toast, and field
validation indicators:

- solid accents: `--af-color-info`, `--af-color-success`,
  `--af-color-warning`, `--af-color-danger`;
- status surfaces: `--af-color-status-{neutral,info,success,warning,danger}-bg`;
- status text: `--af-color-status-{neutral,info,success,warning,danger}-fg`;
- status borders: `--af-color-status-{neutral,info,success,warning,danger}-border`.

For example, an app can change the primary product color without restyling each
button or toast action:

```css
:root {
    --af-color-primary: #0b5cab;
    --af-color-primary-fg: #ffffff;
}
```

## Themes And User Preferences

`data-af-theme="dark"` selects the dark token set. The token layer also sets
`color-scheme` to match the active theme, so browser-provided control and
scrollbar UI can match the application.

In `@media (forced-colors: active)`, the framework resolves its semantic tokens
to CSS system colors. It intentionally does not use `forced-color-adjust: none`:
user-selected high-contrast colors take priority over the product palette.

This follows the platform model in the [CSS Color Adjustment Module Level 1](https://www.w3.org/TR/css-color-adjust-1/).

This is a baseline, not proof of support. Verify critical flows with real
forced-colors, zoom, text-spacing, and browser/assistive-technology testing
before making a conformance claim.

## Component Overrides

Prefer a component option or documented CSS variable before a custom selector.
For example, use `SearchBox({ width })` for ordinary header composition and
reserve lower-level CSS for an exceptional layout:

```css
.course-dashboard [data-af-composition="screen"] {
    --af-screen-max-width: 80rem;
}
```

Keep selectors scoped to application-owned roots. Preserve focus visibility,
target size, semantic color contrast, and forced-colors behavior when
customizing framework components.

## Validation Checklist

When adding a reusable style rule, check it in the playground and a real app:

- light and dark themes;
- narrow viewport and 200% zoom;
- keyboard focus visibility and non-clipping;
- forced-colors or platform high contrast;
- reduced motion where animation is involved;
- text enlargement and long localized strings.

Repeatable hidden/focus geometry checks are available through
[`npm run test:styles`](testing.md#browser-style-contracts). They supplement,
not replace, the playground, application and real assistive-technology checks.

The control-style fixture checks action variants and native toggle indicators in
LTR/RTL, long-label reflow, keyboard focus and enlarged text. Unit tests check
normal text pairs in the shipped light/dark tokens at 4.5:1 and default border/focus
tokens against their canvas at 3:1. Pending actions retain their enabled colors;
opacity must not turn busy-but-available controls into low-contrast text. These
checks do not cover arbitrary app token overrides, imagery or forced-colors paint.
