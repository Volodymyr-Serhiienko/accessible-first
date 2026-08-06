# Menu

Menu provides command-menu behavior with roving focus, item activation, optional typeahead, and Escape close handling.

## When To Use

Use `Menu` for command lists: action menus, dropdown command menus, context menus, and compact tool menus.

Do not use `Menu` for ordinary site navigation. Navigation links should use native links inside a future `Navigation` or `ResponsiveNavigation` pattern.

For selectable choices, use `Listbox`. For switching visible panels, use `Tabs`.

## Quick Start

```ts
Menu({
    items: [
        { value: "new", label: "New file" },
        { value: "save", label: "Save" },
        { value: "delete", label: "Delete", disabled: true }
    ],
    onSelect(detail) {
        console.log(detail.value);
    }
});
```

Horizontal command menu:

```ts
Menu({
    orientation: "horizontal",
    items: [
        { value: "cut", label: "Cut" },
        { value: "copy", label: "Copy" },
        { value: "paste", label: "Paste" }
    ]
});
```

## Layers

- Enhancement API: `createMenu(element, options)`
- Composition API: `Menu(options)`
- Reuses: core `createMenu`, roving focus, typeahead, hover announcement helper

## Behavior

- Adds `role="menu"` to the root element.
- Adds `role="menuitem"` to every item.
- Uses roving tabindex so one enabled item is reachable from the normal `Tab` sequence.
- Supports vertical and horizontal arrow-key navigation.
- Supports typeahead by default.
- Skips disabled items.
- Calls `onSelect` when an enabled item is activated.
- Calls `onClose` on `Escape`.
- Calls `onClose` after selection when `closeOnSelect` is enabled.
- Announces item labels on mouse hover by default for screen reader setups that do not reliably announce menu items on pointer hover.

Keyboard behavior:

- `Tab` moves focus into the current menu item and then onward to the next focusable page control.
- Arrow keys move between enabled items.
- `Home` moves to the first enabled item.
- `End` moves to the last enabled item.
- Typing printable characters moves to the next matching item when typeahead is enabled.
- `Enter` or `Space` activates the focused item.
- `Escape` requests close through `onClose`.

## Options

Root options:

- `items` - Required list of menu item definitions.
- `value` - Controlled current item value.
- `defaultValue` - Initially current item value.
- `orientation` - `"vertical"` or `"horizontal"`. Creation-time option.
- `loop` - Allows arrow navigation to wrap. Creation-time option.
- `typeahead` - Enables character search. Creation-time option.
- `typeaheadTimeout` - Query reset timeout for typeahead. Creation-time option.
- `closeOnSelect` - Requests close after item activation. Creation-time option.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announceOnHover` - Announces item labels on mouse hover. Defaults to `true`.
- `onSelect` - Called when any enabled item is activated.
- `onClose` - Called when the menu asks its owner to close.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `value` - Stable item value.
- `label` - Required item label content.
- `disabled` - Disables one item.
- `defaultCurrent` - Makes one item initially current when `value` and `defaultValue` are not provided.
- `itemOptions` - Common DOM options for the item element.
- `announceOnHover` - Per-item hover announcement override.
- `hoverAnnouncement` - Custom hover announcement text for one item.
- `onSelect` - Called when this item is activated.

## Update Notes

`orientation`, `loop`, `typeahead`, `typeaheadTimeout`, `closeOnSelect`, and `defaultValue` are creation-time options.

Move the current roving-focus item through `value` or controller methods:

```ts
const menu = Menu({
    items: [
        { value: "new", label: "New file" },
        { value: "save", label: "Save" }
    ]
});

menu.setCurrentValue("save", { focus: true });
```

Item updates are partial and matched by index:

```ts
menu.update({
    items: [
        { label: "Create file" },
        { disabled: true }
    ]
});
```

## Styling

Useful hooks include `[data-af-component="menu"]`, `[data-af-menu-item]`, `[aria-disabled]`, `[data-af-disabled]`, `[data-af-orientation]`, and `[data-af-variant]`.

```ts
Menu({
    className: "document-actions",
    items: [...]
});
```

## Manual Checks

- Menu item names are announced.
- `Tab` enters only one current item.
- Arrow keys move between enabled items.
- Disabled items cannot be activated.
- Typeahead moves to matching items.
- `Enter` and `Space` activate enabled items.
- `Escape` calls the close handler.
- Focus indicator is visible.
- Mouse hover announces item labels when `announceOnHover` is enabled.
- Touch targets are comfortable on mobile.
