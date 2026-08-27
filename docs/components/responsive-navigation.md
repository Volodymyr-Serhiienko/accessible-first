# ResponsiveNavigation

ResponsiveNavigation provides one navigation item model with two accessible layouts: a normal link list on wider screens and a collapsible menu on small screens.

It is built on `Navigation`, `Disclosure`, and `OverflowScroller`, so links remain real links. This keeps it useful for multi-page apps, static pages, server-rendered pages, and SPA-style shells.

## When To Use

Use `ResponsiveNavigation` for primary page or app navigation that should remain compact on small screens.

Use `Navigation` directly when the layout does not need mobile collapse. Use `Menu` for temporary command menus, not page navigation.

## Quick Start

```ts
ResponsiveNavigation({
    items: [
        { label: "Home", href: "/" },
        { label: "Components", href: "/components", current: "page" },
        { label: "Docs", href: "/docs" }
    ]
});
```

Inside a page:

```ts
page.navigation(ResponsiveNavigation({
    trigger: "Sections",
    items: [
        { label: "Buttons", href: "#buttons" },
        { label: "Forms", href: "#forms" },
        { label: "Dialogs", href: "#dialogs" }
    ]
}));
```

SPA-style current state:

```ts
const navigation = ResponsiveNavigation({
    items: [
        { id: "home", label: "Home", href: "/" },
        { id: "settings", label: "Settings", href: "/settings" }
    ],
    onNavigate(detail, navigation) {
        detail.event.preventDefault();
        renderRoute(detail.item.href);
        navigation.setCurrent(detail.item.id ?? detail.item.href ?? null);
    }
});
```

## Layers

- Composition API: `ResponsiveNavigation(options)`
- Reuses: `Navigation`, `Disclosure`, `OverflowScroller`, native links, `aria-current`, and native button behavior

## Behavior

- Uses the same `items` for desktop and mobile layouts.
- Shows normal navigation on wider screens and keeps long desktop navigation in one controlled horizontal scroll line.
- Shows a disclosure-style menu trigger on small screens.
- Adds a localized close button at the end of the mobile menu so keyboard and mobile screen-reader users have an explicit way out.
- Closes the mobile menu after a navigation item is activated by default.
- Keeps links as real anchors, so multi-page navigation works without a router.
- Allows SPA-style navigation by cancelling the event in `onNavigate`.
- Mirrors current state across desktop and mobile navigation.
- Provides `getFocusTarget()`, `getResponsiveNavigationFocusTarget(navigation)`, and `ResponsiveNavigationFocusLink()` so app flows can return focus to the visible current item, mobile trigger, or first available navigation link without knowing the internal desktop/mobile layout.

## Options

- `items` - Required navigation items.
- `trigger` - Mobile trigger content. Defaults to `"Menu"`.
- `closeButton` - Mobile close button content. Defaults to localized `"Close menu"`; pass `null` to hide it when the surrounding shell provides another close route.
- `triggerIconPosition` - Mobile trigger icon side: `"end"` or `"start"`. Defaults to `"end"`.
- `current` - Optional current item match by item `id` or `href`.
- `variant` - Desktop navigation variant. Defaults to `"pills"`.
- `mobileVariant` - Mobile navigation variant. Defaults to `"pills"`.
- `size` - `"md"`.
- `closeOnNavigate` - Closes the mobile disclosure after navigation. Defaults to `true`.
- `desktopNavigationOptions` - Options passed to the desktop `Navigation`.
- `overflowScrollerOptions` - Options passed to the desktop `OverflowScroller`.
- `mobileNavigationOptions` - Options passed to the mobile `Navigation`.
- `disclosureOptions` - Options passed to the mobile `Disclosure`.
- `onNavigate` - Called when any item link is activated.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Navigation item options are the same as [Navigation](./navigation.md#options).

## Update Notes

```ts
navigation.setCurrent("/settings");

navigation.update({
    trigger: "Menu",
    items: nextItems
});
```

`setCurrent(value)` matches an item by `id` first and then by `href`. Pass `null` to clear current state.

`getFocusTarget()` returns the best visible focus destination for workflow links such as "Back to navigation". It prefers the current desktop link, then the current mobile link, then the visible mobile trigger, then the first desktop link, and finally the navigation root.

Use `ResponsiveNavigationFocusLink()` when the return route should be a visible link:

```ts
ResponsiveNavigationFocusLink({
    text: "Back to navigation",
    href: "#navigation",
    navigation: () => navigation,
    scroll: {
        block: "nearest",
        inline: "nearest",
        behavior: "auto"
    }
});
```

Updating `items` updates both desktop and mobile navigation lists.

## Styling

Useful hooks include `[data-af-composition="responsive-navigation"]`, `[data-af-responsive-navigation-desktop]`, `[data-af-responsive-navigation-desktop-list]`, `[data-af-responsive-navigation-mobile]`, `[data-af-responsive-navigation-trigger]`, `[data-af-trigger-icon-position]`, `[data-af-responsive-navigation-panel]`, `[data-af-responsive-navigation-panel-content]`, and `[data-af-responsive-navigation-close]`.

The default breakpoint is intentionally conservative. Application shells can override layout with their own CSS when they need a different breakpoint.

## Manual Checks

- Desktop layout exposes a normal list of links.
- Mobile layout exposes one trigger and then links after opening.
- Trigger announces expanded/collapsed state.
- Links remain reachable with Tab.
- Focus indicators are not clipped by the horizontal desktop scroller.
- Mobile menu closes after link activation unless `closeOnNavigate` is false.
- Mobile close button closes the menu and restores focus to the menu trigger.
- Current item is announced consistently in both layouts.
- Return-to-navigation flows use `ResponsiveNavigationFocusLink()` or `getFocusTarget()` to focus the visible current item or mobile trigger instead of depending on app-specific DOM queries.
- Hidden desktop/mobile duplicate links are not reachable by keyboard.
