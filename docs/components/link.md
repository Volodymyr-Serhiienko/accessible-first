# Link

Link provides accessible navigation behavior and default styling hooks.

## When To Use

Use `Link` for navigation. Use `Button` for actions that do not navigate.

Native `<a>` behavior is preferred. Enhancement APIs can add fallback link semantics to non-native elements when needed.

## Quick Start

```ts
Link({
    text: "Documentation",
    href: "/docs",
    hint: "Opens the documentation overview."
});
```

Visual and screen reader hint:

```ts
Link({
    text: "GitHub",
    href: "https://github.com/example/project",
    external: true,
    hint: "Opens the project repository in a new tab.",
    hintDisplay: "both"
});
```

External link:

```ts
Link({
    text: "GitHub",
    href: "https://github.com/example/project",
    external: true,
    target: "_blank"
});
```

Enhance existing HTML:

```ts
const link = createLink(existingLink, {
    href: "/docs",
    variant: "standalone"
});
```

## Layers

- Enhancement API: `createLink(element, options)`
- Composition API: `Link(options)`
- Reuses: core link behavior, component lifecycle, and shared control hint

## Behavior

- Preserves native anchor navigation when used with `<a>`.
- Adds `role="link"` for non-native elements.
- Adds `Enter` activation for non-native elements.
- Supports disabled state through `aria-disabled`.
- Removes disabled links from the tab order.
- Supports `aria-current`.
- Supports external links with safe `_blank` defaults and `noopener noreferrer` for new browsing contexts.
- Supports optional `hint` through `aria-describedby` and optional visual tooltip.
- Exposes stable data attributes for styling.
- Restores original attributes on `destroy()`.

## Options

- `text` - Simple visible label.
- `children` - Rich content instead of `text`.
- `href` - Link destination.
- `disabled` - Makes the link unavailable.
- `external` - Marks the link as external.
- `target` - Browser target, for example `"_blank"`.
- `rel` - Link relationship.
- `current` - Sets `aria-current`.
- `hint` - Supporting context for the link.
- `hintId` - Custom id for the generated hint text.
- `hintDisplay` - `"description"`, `"tooltip"`, `"both"`, or `"none"`.
- `hintAnnounceOnHover` - Announces hint text when a mouse pointer enters the link.
- `variant` - `"default"`, `"muted"`, or `"standalone"`.
- `size` - `"md"`.
- `onNavigate` - Called when the link is activated.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Useful hooks include `[data-af-component="link"]`, `[data-af-variant]`, `[data-af-state]`, and `[aria-current]`.

```ts
Link({
    text: "Skip to examples",
    href: "#examples",
    variant: "standalone",
    className: "section-link"
});
```

## Manual Checks

- Tab reaches enabled links.
- Disabled links are skipped.
- Focus indicator is visible.
- `Enter` activates the link.
- Current page links expose current state.
- External links use safe `rel` values when opened in a new tab.
- Screen readers announce name and link role.
- Hint is announced on focus when `hintDisplay` is `"description"` or `"both"`.
- Visual tooltip appears on hover/focus when `hintDisplay` is `"tooltip"` or `"both"`.
- Link text is readable in light and dark themes.

