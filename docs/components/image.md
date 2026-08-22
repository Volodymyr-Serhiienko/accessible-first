# Image

Image creates an accessible native image with explicit informative or decorative semantics and small built-in presentation presets.

## When To Use

Use `Image` for content images, screenshots, illustrations, photos, avatars, thumbnails, and logos used outside a dedicated Brand block.

Use `Icon` for small symbolic UI marks. Use `Brand` when a logo, name, and optional tagline form a product or app identity block.

## Quick Start

Informative image:

```ts
Image({
    src: "/screenshots/editor.png",
    alt: "Accessible First editor showing a settings form",
    loading: "lazy",
    decoding: "async",
    variant: "rounded"
});
```

Decorative image:

```ts
Image({
    src: "/assets/pattern.svg",
    decorative: true
});
```

Cropped card image:

```ts
Image({
    src: "/lessons/spanish-basics.jpg",
    alt: "Spanish vocabulary cards on a desk",
    aspectRatio: "16 / 9",
    fit: "cover",
    radius: "md"
});
```

Avatar:

```ts
Image({
    src: "/avatars/maria.webp",
    alt: "Maria Ivanova",
    variant: "avatar",
    inlineSize: "3rem"
});
```

Brand logo:

```ts
Brand({
    name: "Accessible First",
    logo: Image({
        src: "/logo.svg",
        decorative: true
    })
});
```

## Layers

- Composition API: `Image(options)`
- Alias: `Img(options)`
- Reuses: native image semantics, composition options, and shared image styling hooks

## Behavior

- Informative images require `alt` text at the type level.
- Decorative images use empty `alt` and `aria-hidden="true"`.
- `Image` does not invent fallback alt text.
- `loading`, `decoding`, and `fetchPriority` map to native image attributes.
- `aspectRatio`, `fit`, `objectPosition`, `inlineSize`, and `blockSize` apply CSS custom properties.
- Presentation presets never replace meaningful `alt` text decisions.

## Options

- `src` - Image URL.
- `alt` - Required text alternative for informative images.
- `decorative` - Set to `true` when the image should be hidden from assistive technologies.
- `width` - Native width attribute.
- `height` - Native height attribute.
- `loading` - `"eager"` or `"lazy"`.
- `decoding` - `"sync"`, `"async"`, or `"auto"`.
- `fetchPriority` - `"high"`, `"low"`, or `"auto"`.
- `fit` - `"contain"`, `"cover"`, `"fill"`, `"none"`, or `"scale-down"`.
- `radius` - `"none"`, `"sm"`, `"md"`, `"lg"`, or `"full"`.
- `variant` - `"plain"`, `"rounded"`, `"thumbnail"`, or `"avatar"`.
- `aspectRatio` - CSS aspect ratio such as `"16 / 9"` or `"1 / 1"`.
- `objectPosition` - CSS object position such as `"center"` or `"top"`.
- `inlineSize` - CSS inline size, useful for avatars and controlled media.
- `blockSize` - CSS block size, useful with `fit`.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Styling

Useful hooks include `[data-af-composition="image"]`, `[data-af-image-variant]`, `[data-af-image-fit]`, `[data-af-image-radius]`, and `[data-af-image-aspect-ratio]`.

CSS variables:

- `--af-image-fit`
- `--af-image-aspect-ratio`
- `--af-image-object-position`
- `--af-image-inline-size`
- `--af-image-block-size`

```ts
Image({
    src: "/hero.jpg",
    alt: "Dashboard overview",
    className: "hero-media",
    aspectRatio: "21 / 9",
    fit: "cover"
});
```

## Manual Checks

- Informative images announce useful alt text once.
- Decorative images are skipped by screen readers.
- Brand logos are not announced twice when the brand name is visible.
- Cropped images preserve important visual content at mobile widths.
- Images do not overflow small screens.
- Lazy loading is not used for critical first-viewport imagery unless intentionally chosen.
