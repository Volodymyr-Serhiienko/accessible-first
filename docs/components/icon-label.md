# IconLabel

IconLabel composes a visible icon and label for use inside a Button, Link, or Navigation item.

## When To Use

Use IconLabel when an action or navigation item needs both a familiar visual symbol and visible text, including compact navigation where the icon sits above its caption.

It is not interactive by itself. The parent Button or Link owns semantics, focus, keyboard behavior, and activation.

## Quick Start

```ts
Link({
    href: "#settings",
    children: [
        IconLabel({
            icon: Icon({
                path: settingsIconPath,
                decorative: true
            }),
            label: "Settings",
            iconPosition: "top"
        })
    ]
});
```

The same node can be used as a Navigation item label:

```ts
Navigation({
    items: [
        {
            href: "#home",
            label: IconLabel({
                icon: Icon({
                    path: homeIconPath,
                    decorative: true
                }),
                label: "Home",
                iconPosition: "top"
            })
        }
    ]
});
```

## Layers

- Composition API: `IconLabel(options)`
- Reuses: native text content, Icon, Button, Link, and Navigation
- Adds no ARIA role, Tab stop, live region, or interaction behavior

## Behavior

- The label remains visible and normally provides the accessible name of its parent control.
- Icons are normally decorative because repeating the same meaning to assistive technology is noise.
- Use an informative icon only when it communicates additional, distinct content.
- `iconPosition` defaults to `"start"`.
- The helper owns and destroys composed icon or label children when its parent is destroyed.

## Options

- `icon` - Icon or other composition child.
- `label` - Visible label content.
- `iconPosition` - `"start"`, `"end"`, `"top"`, or `"bottom"`.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Useful hooks include `[data-af-composition="icon-label"]`, `[data-af-icon-label-position]`, `[data-af-icon-label-icon]`, and `[data-af-icon-label-text]`.

```css
[data-af-composition="icon-label"] {
    --af-icon-label-gap: 0.25rem;
}
```

## Manual Checks

- The parent link or button is one focus stop, not the icon and label separately.
- A screen reader announces the visible label and parent role once.
- Decorative icons are skipped by assistive technologies.
- Icon-above-label navigation remains legible and operable at narrow widths.
- The same item works with mouse, keyboard, touch, and mobile screen-reader exploration.