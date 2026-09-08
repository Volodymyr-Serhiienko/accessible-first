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