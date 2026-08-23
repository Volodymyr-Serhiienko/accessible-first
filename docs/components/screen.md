# Screen

Screen creates a top-level application view for `AppShell` and `PageOutlet` content.

Use it for complete app screens such as dashboards, settings pages, lesson lists, vocabulary views, profile pages, search results, and future reference application screens.

## Quick Start

```ts
Screen({
    title: "Lessons",
    description: "Practice vocabulary, grammar, and listening skills.",
    actions: Button({
        text: "New lesson",
        variant: "primary"
    }),
    children: LessonsList()
});
```

## Purpose

`Screen` is not a replacement for `Section`.

Use `Section` for document sections inside a page. Use `Screen` for the whole active application view rendered inside a `PageOutlet`.

A screen provides a predictable structure:

- labelled root section;
- title;
- optional visible description;
- optional action area;
- body content;
- optional footer;
- programmatic focus targets for predictable screen-reader and keyboard routes.

## AppShell And PageOutlet

`Screen` pairs naturally with `AppShell`:

```ts
const shell = AppShell({
    header: Header(),
    navigation: Navigation()
});

shell.render(Screen({
    title: "Settings",
    description: "Manage account and learning preferences.",
    children: SettingsContent()
}));
```

`PageOutlet` can focus and announce a screen change while the screen itself provides the visible and semantic structure.

## Focus Routes

Screen exposes named focus targets so application code can move users to a meaningful place after route changes, command-palette actions, form submissions, or other screen-level events.

```ts
const screen = Screen({
    title: "Settings",
    description: "Manage account and learning preferences.",
    defaultFocusTarget: "title",
    children: SettingsContent()
});

screen.focus("title");
screen.focus("body");
screen.focus("actions");
```

Available targets are `"screen"`, `"title"`, `"description"`, `"body"`, `"actions"`, and `"footer"`. If an optional target is hidden or empty, Screen falls back to the title or another stable visible target.

These targets are not added to the regular Tab order. The framework focuses them programmatically, which keeps normal keyboard navigation clean while still allowing accessible route and workflow transitions.

## Description Speech

By default, `Screen` keeps `description` as visible content and does not connect it through `aria-describedby`. This avoids repeated screen description speech during route changes, because `PageOutlet`, route announcements, or focus routes should own screen-change feedback.

Use `descriptionMode: "aria"` only when the screen root itself should carry the visible description as a programmatic description.

## Options

- `title` - required screen title content.
- `description` - optional short explanation for the screen.
- `children` - main body content.
- `actions` - primary screen actions, usually shown near the title.
- `footer` - low-priority footer content inside the screen.
- `descriptionMode` - `"content"` or `"aria"`. Defaults to `"content"`, which keeps the description visible without forcing it through `aria-describedby`.
- `headingLevel` - heading level for the title. Default is `2`.
- `variant` - `"default"` or `"plain"`.
- `size` - size token. Currently `"md"`.
- `actionsLabel` - accessible label for the action group.
- `actionsAlign` - alignment passed to the internal `ActionsBar`.
- `headerOptions` - DOM options for the screen header.
- `titleOptions` - DOM options for the title element.
- `descriptionOptions` - DOM options for the description element.
- `bodyOptions` - DOM options for the body element.
- `actionsOptions` - DOM options for the actions container.
- `footerOptions` - DOM options for the screen footer.
- `defaultFocusTarget` - default target used by `screen.focus()`. Defaults to `"title"`.

## Methods

- `getTitleText()` - returns normalized title text.
- `getDescriptionText()` - returns normalized description text.
- `setTitle(content)` - updates the screen title.
- `setDescription(content)` - updates the description.
- `setBody(content)` - updates body content.
- `setActions(content)` - updates screen actions.
- `setFooter(content)` - updates footer content.
- `getFocusTarget(target)` - returns the HTMLElement for a named focus target.
- `focus(target, options)` - programmatically focuses a named target without adding it to the Tab order.
- `update(options)` - updates mutable options.
- `destroy()` - disposes slots and actions.

## Accessibility

`Screen` renders a native `section` and connects it to its title with `aria-labelledby`.

Screen does not use live regions or forced announcements. Route changes, command-palette actions, and PageOutlet transitions should decide when screen changes are spoken.

When a description is present, it remains visible content by default. Set `descriptionMode: "aria"` only when the screen root should be programmatically described by that text. Keep descriptions short and useful; long instructions usually belong in the body.

The default heading level is `2`, which works well when the application header already contains the main `h1`. Use `headingLevel: 1` only when the screen is the primary document title.

Screen actions are grouped through `ActionsBar`. Use `actionsLabel` when the purpose of the actions is not obvious from the title.

Use focus targets intentionally. A route change usually focuses the title. A completed form may focus the body, a validation summary, or the next meaningful section. A command-palette action should not leave focus behind on the command trigger when the visible screen changed.

## Actions Placement

The default action placement is in the screen header, next to the title and description. This matches common app screens where page-level actions such as Create, Save, Export, or Start are visible before the main content.

Future screen templates may add alternative placements such as footer actions after repeated real application use proves the need.

## Styling

Screen sets:

```html
data-af-composition="screen"
data-af-screen-header
data-af-screen-title
data-af-screen-description
data-af-screen-body
data-af-screen-actions
data-af-screen-footer
```

Customize spacing and title size with CSS variables:

```css
.my-screen {
    --af-screen-gap: 1.25rem;
    --af-screen-title-size: 1.75rem;
    --af-screen-description-width: 44rem;
}
```

## Manual Checks

- The screen has one clear title.
- The title is announced as the screen label.
- The description is short and useful. It is announced with the screen only when `descriptionMode: "aria"` and supported by the browser/screen reader pair.
- Header actions wrap cleanly on small screens.
- Body content does not create horizontal overflow.
- Footer content remains secondary and does not hide primary actions.
- Route changes and screen-level actions move focus to a meaningful Screen target.

