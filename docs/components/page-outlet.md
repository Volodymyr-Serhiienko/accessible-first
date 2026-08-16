# PageOutlet

PageOutlet is a managed content region for application screens.

It lets an app keep a stable page shell - header, navigation, footer, theme controls - while replacing only the active screen inside `main`.

Screen pairs well with PageOutlet when each routed view needs a consistent title, description, actions, body, and footer structure.

## When To Use

Use `PageOutlet` for SPA-style screens, lightweight route switching, multi-page-like demos, settings pages, lessons, dashboards, and other application content that changes inside a stable shell.

Use `page.setMainContent(...)` for a one-time replacement of the whole `main` landmark. Use `PageOutlet` when content will change repeatedly.

## Quick Start

```ts
const outlet = PageOutlet({
    label: "Application content",
    title: "Overview",
    children: [
        H2("Overview"),
        P("Welcome to the application.")
    ]
});

page.setMainContent(outlet);

outlet.render([
    H2("Settings"),
    P("Update application preferences.")
], {
    title: "Settings",
    documentTitle: "Settings - Example App"
});
```

## Layers

- Composition API: `PageOutlet(options)`
- Reuses: composition slots, focus helpers, live-region announcements, and native DOM scrolling

## Behavior

- Owns and safely replaces one screen region.
- Destroys composed nodes from the previous screen before rendering the next one.
- Can update `document.title` for route-like changes.
- Scrolls the outlet into view by default after rendering new content.
- Moves focus after rendering by default, preferring the first heading and falling back to the outlet itself.
- Announces rendered screen changes by default.
- Can render quietly when a change should not be announced.

## Options

- `children` - Initial content.
- `label` - Optional accessible label for the outlet region.
- `title` - Logical title used for default announcements.
- `documentTitle` - Optional initial document title.
- `focusTarget` - `"first-heading"`, `"first-focusable"`, `"outlet"`, an element, a function returning an element, or `null`. Defaults to `"first-heading"`.
- `scrollOnRender` - Scrolls the outlet into view when rendering new content. Defaults to `true`.
- `announcement` - `true`, `false`, fixed text, or a function. Defaults to `true`.
- `announcementPoliteness` - `"polite"` or `"assertive"`. Defaults to `"polite"`.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Render Options

`outlet.render(content, options)` and `outlet.setContent(children, options)` accept:

- `title` - New logical screen title.
- `documentTitle` - New document title.
- `focusTarget` - Overrides the default focus target for this render.
- `scroll` - Overrides default scroll behavior for this render.
- `announcement` - Overrides default announcement behavior for this render.

## Manual Checks

- Rendering a new screen removes the old screen.
- Focus moves to the first heading or configured target.
- Screen reader users hear the screen change.
- Browser scroll returns to the new content start.
- Header, navigation, footer, and theme controls are not recreated.

