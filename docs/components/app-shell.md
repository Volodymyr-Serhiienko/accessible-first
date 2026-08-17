# AppShell

AppShell creates a semantic application scaffold from existing Accessible First page primitives.

Use it when an app needs a stable header, navigation, main content outlet, optional footer, page layout, and accessible page defaults.

## Quick Start

```ts
const shell = AppShell({
    title: "Language App",
    theme: "system",
    header: Header(),
    navigation: Navigation(),
    footer: Footer()
});

shell.render(HomeScreen());

mount(shell, "#app");
```

## Purpose

AppShell is a thin composition helper. It combines:

- `createPage`
- `PageOutlet`
- `PageLayout`
- header, navigation, main, and footer landmarks

It does not own routing. Use `HashRouter` or native links on top of AppShell depending on the app model.

## Routing And Search

Use [App Routes](./app-routes.md) when one route list should feed navigation, search, breadcrumbs, parent route trails, and routing metadata.

Use `Screen` for complete application views rendered inside the shell outlet.

`AppShell` owns the stable page frame. Route helpers own shared route data, including labels, hrefs, keywords, and route hierarchy. `HashRouter` or native links own navigation behavior.

This keeps the framework flexible for:

- single-page applications;
- multi-page applications;
- static pages;
- server-rendered pages;
- playground and documentation demos.

## Options

- `title` - document title passed to `createPage`.
- `mainId` - id for the main landmark.
- `skipLink` - skip-link text, boolean, or disabled state.
- `skipLinkTargetId` - skip-link target id.
- `navigationLabel` - accessible name for the navigation landmark.
- `theme` - `"system"`, `"light"`, or `"dark"`.
- `header` - header slot content.
- `navigation` - navigation slot content.
- `beforeOutlet` - content rendered before the dynamic outlet.
- `content` - initial outlet content.
- `afterOutlet` - content rendered after the dynamic outlet.
- `footer` - footer slot content.
- `outletOptions` - options passed to `PageOutlet`.
- `layout` - `PageLayout` options, or `false` to disable automatic layout.
- `inspect` - `true` or diagnostics options to run page diagnostics after creation.

## Methods

- `render(content, options)` - replaces the current outlet screen.
- `focus(target)` - moves focus inside the outlet.
- `setHeader(content)` - updates header content.
- `setNavigation(content)` - updates navigation content.
- `setBeforeOutlet(content)` - updates content before the outlet.
- `setAfterOutlet(content)` - updates content after the outlet.
- `setFooter(content)` - updates footer content.
- `inspect(options)` - runs page diagnostics.
- `update(options)` - updates mutable shell options.
- `destroy()` - destroys layout, outlet, slots, and page.

## Accessibility

AppShell keeps native landmarks stable while changing only the outlet content. This helps keyboard and screen reader users stay oriented during application navigation.

Use `PageOutlet` render options to control scroll, focus target, and announcements for each screen change.

Recommended screen-change defaults:

```ts
shell.render(SettingsScreen(), {
    scroll: true,
    focusTarget: "outlet",
    announcement: "Settings loaded."
});
```

## Styling

AppShell sets:

```html
data-af-composition="app-shell"
data-af-app-shell
```

The default page layout comes from `PageLayout`. Customize spacing and width through `layout`:

```ts
AppShell({
    layout: {
        maxWidth: "72rem",
        gutter: "1rem",
        mainGap: "1rem"
    }
});
```

Use `layout: false` when an app wants to own all page layout styles manually.

## Manual Checks

- Header, navigation, main, and footer landmarks are present when supplied.
- Skip link moves to the intended target.
- Dynamic content changes keep header and navigation stable.
- Screen changes scroll to the expected start position.
- Screen changes move focus to a useful target.
- Page diagnostics do not report missing names, duplicate ids, or broken ARIA references.



