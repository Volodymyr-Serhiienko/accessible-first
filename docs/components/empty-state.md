# EmptyState

EmptyState provides a clear, accessible block for screens or areas that have no content to show yet.

Use it for no-results messages, empty lists, first-run states, unavailable content, recoverable errors, and application screens that need a concise explanation plus optional actions.

## When To Use

Use `EmptyState` when a page area would otherwise look blank or confusing.

Common places:

- search with no matching results;
- empty lists, tables, lesson collections, or dashboards;
- first-run onboarding prompts;
- optional setup steps;
- recoverable error states with retry actions;
- future application screens such as a foreign-language learning app with no lessons, words, or practice sessions yet.

Use `AlertDialog` when the user must make a blocking decision. Use inline validation for form field errors. Use `Toast` only for short non-blocking feedback.

## Quick Start

Minimal empty state:

```ts
EmptyState({
    title: "No lessons yet",
    description: "Create the first lesson to start building your course."
});
```

With an action:

```ts
EmptyState({
    title: "No saved words",
    description: "Words you save during practice will appear here.",
    actions: Button({
        text: "Start practice",
        variant: "primary"
    })
});
```

With media and custom alignment:

```ts
EmptyState({
    align: "start",
    media: Icon({
        path: "M12 3 3 8l9 5 9-5-9-5Zm-7 8v5l7 4 7-4v-5",
        decorative: true,
        size: "3rem"
    }),
    title: "Vocabulary is empty",
    description: "Add a word manually or import a list.",
    actions: [
        Button({ text: "Add word", variant: "primary" }),
        Button({ text: "Import", variant: "secondary" })
    ]
});
```

## Layers

- Composition API: `EmptyState(options)`
- Reuses: native headings, composition slots, optional `ActionsBar`
- Does not add keyboard behavior because actions keep their native component behavior

## Behavior

- Renders a semantic visual state block with a required heading.
- Supports optional media, description, and actions.
- Uses a native heading level selected by `headingLevel`.
- Treats media as decorative by default through `mediaHidden: true`, so icons do not create extra screen reader noise.
- Keeps actions in a consistent grouped layout through `ActionsBar`.
- Does not announce itself automatically. Use `PageOutlet`, route announcements, inline status, or a live region when a dynamic state change must be spoken.
- Keeps `description` as normal visible content; it is read when the user reaches the block naturally, not forced through a live region.
- Does not create a landmark by default. Add `role`, `aria-label`, or `aria-labelledby` through common composition options only when the block needs region semantics.
- Exposes stable data attributes for styling.

## Options

- `title` - Required title content.
- `description` - Optional explanatory content.
- `media` - Optional media content. Decorative icons are hidden from assistive technologies by default.
- `mediaHidden` - Whether the media slot is decorative and hidden from assistive technologies. Defaults to `true`; set to `false` for meaningful `Image` content with useful `alt` text.
- `actions` - Optional action content, usually one or more buttons or links.
- `headingLevel` - Heading level from `2` to `6`. Defaults to `2`.
- `align` - `"center"` or `"start"`. Defaults to `"center"`.
- `variant` - `"default"` or `"plain"`. Defaults to `"default"`.
- `size` - `"md"`.
- `actionsLabel` - Optional accessible label for the actions group.
- `actionsAlign` - Alignment passed to the internal `ActionsBar`: `"start"`, `"end"`, `"between"`, or `"stretch"`. Defaults to `"start"`.
- `mediaOptions` - Common DOM options for the media slot.
- `titleOptions` - Common DOM options for the title element.
- `descriptionOptions` - Common DOM options for the description slot.
- `actionsOptions` - Common DOM options for the internal actions bar.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

## Update Notes

```ts
const empty = EmptyState({
    title: "No results",
    description: "Try another search term."
});

empty.setDescription("Try changing filters or clearing the search field.");
empty.setActions(Button({ text: "Clear search", variant: "primary" }));
empty.update({
    align: "start"
});
```

Use `setMedia(null)`, `setDescription(null)`, or `setActions(null)` to hide optional slots.

## Styling

Useful hooks include `[data-af-composition="empty-state"]`, `[data-af-empty-state-media]`, `[data-af-empty-state-title]`, `[data-af-empty-state-description]`, `[data-af-empty-state-actions]`, `[data-af-align]`, `[data-af-variant]`, and `[data-af-size]`.

```ts
EmptyState({
    className: "library-empty-state",
    title: "Library is empty",
    description: "Imported files will appear here."
});
```

The default styles use CSS custom properties such as `--af-empty-state-max-width`, `--af-empty-state-padding`, `--af-empty-state-media-size`, and `--af-empty-state-description-width`.

## Manual Checks

- The heading clearly names the state.
- The description explains what happened and what the user can do next.
- Empty states are not used for blocking decisions.
- Actions are reachable by keyboard and have clear names.
- Icons that are decorative are hidden from assistive technologies.
- Meaningful media uses `mediaHidden: false` and has an accessible name, such as informative image `alt` text.
- The block remains readable in light and dark themes.
- Layout remains comfortable on small screens.

