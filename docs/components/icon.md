# Icon

Icon creates a small visual symbol for buttons, badges, cards, empty states, and other composed UI.

## When To Use

Use `Icon` when an interface needs a compact symbol. Use inline `path` icons for theme-colored symbols that should follow `currentColor`. Use `src` icons when the artwork already exists as an SVG, PNG, WebP, or similar file.

For full content images, logos, screenshots, illustrations, and photos, use the Image helper/component instead of Icon.

## Quick Start

Inline path icon:

```ts
Icon({
    path: "M5 13l4 4L19 7",
    decorative: true
});
```

Outlined path icon:

```ts
Icon({
    path: "M5 13l4 4L19 7",
    decorative: true,
    variant: "outline"
});
```

File-based icon:

```ts
Icon({
    src: "/assets/save.svg",
    decorative: true
});
```

Icon inside IconButton:

```ts
IconButton({
    label: "Save",
    icon: Icon({
        src: "/assets/save.svg",
        decorative: true
    })
});
```

Meaningful standalone icon:

```ts
Icon({
    src: "/assets/status-warning.svg",
    alt: "Warning"
});
```

## Layers

- Composition API: `Icon(options)`
- Reuses: composition options, image loading hints for file-based icons, and shared icon styling hooks

## Behavior

- Icons are decorative by default when no `title`, `alt`, `aria-label`, or `aria-labelledby` is provided.
- Decorative icons are hidden from assistive technologies.
- Meaningful standalone icons expose `role="img"` on the wrapper.
- Inline `path` icons render an inner SVG hidden from assistive technologies.
- `variant: "outline"` applies common stroke icon defaults: no fill, currentColor stroke, round line caps, and round joins.
- File-based `src` icons render an inner image with empty `alt`; the wrapper owns the accessible name when needed.
- `size` sets `--af-icon-size` on the wrapper.

## Options

- `path` - SVG path data string or array of path strings.
- `variant` - `"solid"` or `"outline"` for path-based icons. Defaults to solid fill.
- `strokeWidth` - Stroke width used by `variant: "outline"`. Defaults to `2`.
- `src` - External icon asset URL for SVG, PNG, WebP, or similar files.
- `alt` - Accessible name shortcut for meaningful file-based icons.
- `title` - Accessible name shortcut for meaningful icons.
- `decorative` - Forces the icon to be hidden from assistive technologies.
- `size` - CSS size for the icon box, such as `"1.25rem"`.
- `viewBox` - SVG viewBox for path-based icons. Defaults to `"0 0 24 24"`.
- `svgAttributes` - Extra attributes for the inner SVG.
- `pathAttributes` - Extra attributes for generated SVG paths.
- `width` - Native image width for file-based icons.
- `height` - Native image height for file-based icons.
- `loading` - Native image loading mode for file-based icons.
- `decoding` - Native image decoding hint for file-based icons.
- `fetchPriority` - Native image fetch priority hint for file-based icons.
- `imageAttributes` - Extra attributes for the inner image.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Useful hooks include `[data-af-composition="icon"]`, `[data-af-composition="icon"] > svg`, and `[data-af-composition="icon"] > img`.

```ts
Icon({
    src: "/assets/logo-mark.svg",
    decorative: true,
    className: "app-icon",
    attributes: { "data-tone": "brand" }
});
```

## Manual Checks

- Decorative icons are skipped by screen readers.
- Meaningful standalone icons announce one clear name.
- Icon-only buttons expose the button label, not duplicate icon text.
- File-based icons fit the icon box without stretching.
- Inline path icons inherit the surrounding text color where expected.
