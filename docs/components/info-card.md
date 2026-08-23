# InfoCard

InfoCard provides a structured, accessible card for one meaningful item, summary, lesson, setting, result, or dashboard entry.

It is not just a decorative panel. InfoCard has named slots for media, meta, title, description, body content, and actions, so repeated page items stay consistent and easy to scan.

## When To Use

Use `InfoCard` when an interface shows one self-contained item or summary.

Common places:

- lesson cards in a learning application;
- vocabulary or practice summaries;
- settings summaries;
- dashboard cards;
- search results;
- profile or account summaries;
- feature cards inside documentation or onboarding screens.

Use `Panel` when you only need a framed container. Use `DescriptionList` for term/details content. Use `EmptyState` when there is no item to show.

## Quick Start

Minimal card:

```ts
InfoCard({
    title: "Beginner vocabulary",
    description: "Practice common words and phrases."
});
```

With actions:

```ts
InfoCard({
    title: "Daily practice",
    description: "Continue your current practice session.",
    actionsLabel: "Daily practice actions",
    actions: Button({
        text: "Start practice",
        variant: "primary"
    })
});
```

With media, meta, body, and horizontal layout:

```ts
InfoCard({
    orientation: "horizontal",
    media: Icon({
        path: "M12 3v18m9-9H3",
        decorative: true,
        size: "3rem"
    }),
    meta: "12 words - 5 minutes",
    title: "Review queue",
    description: "Words due for spaced repetition appear here.",
    children: P("Use the body slot for compact supporting content."),
    actions: [
        Button({ text: "Review", variant: "primary" }),
        Link({ text: "Details", href: "/review" })
    ]
});
```

## Layers

- Composition API: `InfoCard(options)`
- Reuses: native `article`, `section`, or `div`; heading elements; composition slots; optional `ActionsBar`
- Does not add keyboard behavior because actions keep their native component behavior

## Behavior

- Renders a structured card with a required heading.
- Uses `article` by default for self-contained content.
- Supports optional media, meta, description, body, and actions.
- Uses a native heading level selected by `headingLevel`.
- InfoCard does not hide media by default because card images and previews are often meaningful.
- Keeps actions grouped through `ActionsBar`.
- Does not make the entire card clickable by default. Put links or buttons in the title, body, or actions instead.
- Does not create automatic announcements. Use `PageOutlet`, live regions, or inline status when dynamic changes must be spoken.
- Keeps `description`, `meta`, and body content as normal visible content instead of forcing them through a live region.
- Exposes stable data attributes for styling.

## Options

- `title` - Required card title content.
- `description` - Optional explanatory content.
- `media` - Optional image, icon, logo, or visual preview content.
- `mediaHidden` - Whether the whole media slot is decorative and hidden from assistive technologies. Defaults to `false`; set to `true` for decorative media wrappers, or use decorative `Icon`/`Image` content inside the slot.
- `meta` - Optional short metadata content shown before the title.
- `children` - Optional main body content.
- `actions` - Optional action content, usually buttons or links.
- `tagName` - `"article"`, `"section"`, or `"div"`. Defaults to `"article"`.
- `headingLevel` - Heading level from `2` to `6`. Defaults to `3`.
- `orientation` - `"vertical"` or `"horizontal"`. Defaults to `"vertical"`.
- `variant` - `"default"` or `"plain"`. Defaults to `"default"`.
- `size` - `"md"`.
- `actionsLabel` - Optional accessible label for the actions group.
- `actionsAlign` - Alignment passed to the internal `ActionsBar`: `"start"`, `"end"`, `"between"`, or `"stretch"`. Defaults to `"start"`.
- `mediaOptions` - Common DOM options for the media slot.
- `metaOptions` - Common DOM options for the meta slot.
- `titleOptions` - Common DOM options for the title element.
- `descriptionOptions` - Common DOM options for the description slot.
- `bodyOptions` - Common DOM options for the body slot.
- `actionsOptions` - Common DOM options for the internal actions bar.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const lesson = InfoCard({
    title: "Beginner vocabulary",
    description: "Practice common words and phrases."
});

lesson.setMeta("Updated today");
lesson.setActions(Button({ text: "Open", variant: "primary" }));
lesson.update({
    orientation: "horizontal"
});
```

Use `setMedia(null)`, `setMeta(null)`, `setDescription(null)`, `setBody(null)`, or `setActions(null)` to hide optional slots.

## Styling

Useful hooks include `[data-af-composition="info-card"]`, `[data-af-info-card-media]`, `[data-af-info-card-content]`, `[data-af-info-card-meta]`, `[data-af-info-card-title]`, `[data-af-info-card-description]`, `[data-af-info-card-body]`, `[data-af-info-card-actions]`, `[data-af-orientation]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
InfoCard({
    className: "lesson-card",
    title: "Travel phrases",
    description: "Useful phrases for the first lesson."
});
```

The default styles use CSS custom properties such as `--af-info-card-padding`, `--af-info-card-media-size`, and `--af-info-card-horizontal-media-size`.

## Manual Checks

- The card heading clearly identifies the item.
- Heading levels match the surrounding page structure.
- Interactive actions are reachable by keyboard in a logical order.
- The whole card is not made clickable when it contains other interactive controls.
- Decorative media is hidden from assistive technologies, either by the media content itself or with `mediaHidden: true`.
- Text contrast is readable in light and dark themes.
- Horizontal layout collapses cleanly on small screens.
