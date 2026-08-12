# ResponsiveNavigation

ResponsiveNavigation provides one navigation item model with two accessible layouts: a normal link list on wider screens and a collapsible menu on small screens.

It is built on `Navigation` and `Disclosure`, so links remain real links. This keeps it useful for multi-page apps, static pages, server-rendered pages, and SPA-style shells.

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
- Reuses: `Navigation`, `Disclosure`, native links, `aria-current`, and native button behavior

## Behavior

- Uses the same `items` for desktop and mobile layouts.
- Shows normal navigation on wider screens and keeps long desktop navigation in one horizontal scroll line.
- Shows a disclosure-style menu trigger on small screens.
- Closes the mobile menu after a navigation item is activated by default.
- Keeps links as real anchors, so multi-page navigation works without a router.
- Allows SPA-style navigation by cancelling the event in `onNavigate`.
- Mirrors current state across desktop and mobile navigation.

## Options

- `items` - Required navigation items.
- `trigger` - Mobile trigger content. Defaults to `"Menu"`.
- `triggerIconPosition` - Mobile trigger icon side: `"end"` or `"start"`. Defaults to `"end"`.
- `current` - Optional current item match by item `id` or `href`.
- `variant` - Desktop navigation variant. Defaults to `"pills"`.
- `mobileVariant` - Mobile navigation variant. Defaults to `"pills"`.
- `size` - `"md"`.
- `closeOnNavigate` - Closes the mobile disclosure after navigation. Defaults to `true`.
- `desktopNavigationOptions` - Options passed to the desktop `Navigation`.
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

Updating `items` updates both desktop and mobile navigation lists.

## Styling

Useful hooks include `[data-af-composition="responsive-navigation"]`, `[data-af-responsive-navigation-desktop]`, `[data-af-responsive-navigation-mobile]`, `[data-af-responsive-navigation-trigger]`, `[data-af-trigger-icon-position]`, and `[data-af-responsive-navigation-panel]`.

The default breakpoint is intentionally conservative. Application shells can override layout with their own CSS when they need a different breakpoint.

## Manual Checks

- Desktop layout exposes a normal list of links.
- Mobile layout exposes one trigger and then links after opening.
- Trigger announces expanded/collapsed state.
- Links remain reachable with Tab.
- Focus indicators are not clipped by the horizontal desktop scroller.
- Mobile menu closes after link activation unless `closeOnNavigate` is false.
- Current item is announced consistently in both layouts.
- Hidden desktop/mobile duplicate links are not reachable by keyboard.
