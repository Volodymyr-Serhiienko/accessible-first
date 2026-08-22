# Brand

Brand provides a compact site or app identity block for headers, sidebars, landing pages, and future application shells.

It can render as a home link when `href` is provided, or as a static identity block when it is not.

## When To Use

Use `Brand` when a page needs a consistent product, site, or app identity with optional logo, name, and tagline.

Use a regular heading when the text is only the page title. Use `Image` directly when an image is not acting as part of a brand identity.

## Quick Start

Text brand:

```ts
Brand({
    name: "Accessible First",
    href: "/"
});
```

With logo:

```ts
Brand({
    href: "/",
    logo: Image({
        src: "/logo.svg",
        alt: "",
        decorative: true
    }),
    logoScale: 1.1,
    name: "Accessible First",
    tagline: "Accessible UI by default"
});
```

Static brand:

```ts
Brand({
    name: "Settings",
    nameTag: "h1",
    tagline: "Account workspace"
});
```

## Layers

- Composition API: `Brand(options)`
- Reuses: native anchor when `href` is provided, native layout semantics, and composition slots

## Behavior

- Shows a logo, name, and optional tagline.
- Uses a real link when `href` is provided, so multi-page navigation works without a router.
- Allows SPA-style navigation by cancelling the event in `onNavigate`.
- Keeps logo images decorative when the adjacent brand name already provides the accessible name.
- Sizes the logo slot to the visible brand text block by default, so the logo aligns with the name and tagline.
- Does not create a heading automatically. Page heading structure remains under developer control through `nameTag`.

## Options

- `name` - Required brand name content.
- `nameTag` - Native element for the brand name: `"span"`, `"p"`, `"h1"`, `"h2"`, or `"h3"`. Defaults to `"span"`. Creation-time option.
- `href` - Optional destination. Creation-time option.
- `logo` - Optional logo content, usually `Image(...)`, `Icon(...)`, or trusted inline SVG.
- `logoAspectRatio` - Optional logo slot ratio, such as `"1 / 1"` or `"3 / 1"`. Defaults to `"1 / 1"`.
- `logoScale` - Optional optical scale for the logo image inside the auto-sized logo slot. Defaults to `1.1`.
- `logoOffsetY` - Optional CSS length that nudges the logo slot vertically, such as `"0.08rem"` or `"-2px"`.
- `tagline` - Optional supporting brand text.
- `logoPosition` - `"start"` or `"end"`. Defaults to `"start"`.
- `label` - Optional accessible label for the brand link.
- `external` - Opens as an external link.
- `target` - Native link target.
- `rel` - Native link rel.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `logoOptions` - Common DOM options for the logo slot.
- `nameOptions` - Common DOM options for the name slot.
- `taglineOptions` - Common DOM options for the tagline slot.
- `onNavigate` - Called when the linked brand is activated.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

`href` and `nameTag` are creation-time. If a brand needs to switch between linked/static modes or change the native name element, create a new `Brand`.

```ts
const brand = Brand({
    name: "Accessible First",
    href: "/"
});

brand.setName("Accessible First Docs");
brand.setTagline("Component reference");
brand.setLogo(null);
```

## Styling

Useful hooks include `[data-af-composition="brand"]`, `[data-af-brand-link]`, `[data-af-brand-content]`, `[data-af-brand-logo]`, `[data-af-brand-text]`, `[data-af-brand-name]`, `[data-af-brand-tagline]`, `[data-af-logo-position]`, `[data-af-variant]`, and `[data-af-size]`.

Logo sizing variables:

- `--af-brand-logo-aspect-ratio` - logo slot ratio. Defaults to `1 / 1` for square logos.
- `--af-brand-logo-min-size` - minimum logo size. Defaults to `2rem`.
- `--af-brand-logo-size` - optional fixed logo size override.
- `--af-brand-logo-scale` - inner logo image scale. Defaults to `1.1`.
- `--af-brand-logo-offset-y` - optional vertical nudge for the logo slot when a specific asset needs optical adjustment.

```ts
Brand({
    className: "app-brand",
    name: "Accessible First",
    href: "/"
});
```

## Manual Checks

- Brand link has a clear accessible name.
- Logo is not announced twice when the brand name is visible.
- Focus indicator is visible when the brand is a link.
- Brand remains readable on small screens.
- Multi-page navigation works with a normal `href`.
- SPA interception only happens when `event.preventDefault()` is intentionally used.
