# DropdownMenu

A native button with an anchored command menu. Reuses `Menu`, `Popover`, their
keyboard/focus utilities and viewport collision handling. Ordinary site navigation
remains native links; use `Select` or `Combobox` for form fields.

```ts
const contexts = DropdownMenu({
    trigger: "Workspace",
    value: "personal",
    items: [
        { value: "personal", label: "Personal" },
        { value: "team", label: "Team" }
    ],
    onSelect(detail, dropdown) {
        activateWorkspace(detail.value);
        dropdown.setValue(detail.value);
    }
});
```

## Behavior

- Focus does not open the popup. Click, Enter or Space toggles it and focuses the
  committed item (or the first enabled item).
- Arrow Down/Up on the trigger opens at the first/last enabled item. Inside the
  menu, arrows, Home/End and typeahead move focus without committing a choice.
- Enter/Space/click activates an enabled item, closes the popup and restores
  trigger focus before calling `onSelect`. The application owns the committed
  value, so an asynchronous operation may fail without changing `aria-current`.
- Escape restores trigger focus. Tab/Shift+Tab closes and allows native traversal.
  Focusing/clicking outside closes without stealing focus from the destination.
- A single labelled `role="menu"` is controlled by a button with `aria-haspopup`,
  `aria-expanded` and `aria-controls`. No extra live announcement repeats focus speech.

## API

Options: `trigger`, `items` (the `Menu` item model), `value`, `disabled`,
`triggerOptions`, `position` and `onSelect`, plus common composition options.
Labels and callback feedback are supplied by the application.

Controller: `trigger`, `triggerButton`, `menu`, `open()`, `close()`, `isOpen()`,
`getValue()`, `setValue()`, `setItems()`, `setDisabled()` and `destroy()`.
`setItems()` closes and disposes the previous menu. The dropdown owns composed
item content. `setValue()` is silent and does not call `onSelect`.

For responsive navigation, pass a factory, not one shared DOM instance:

```ts
ResponsiveNavigation({
    leadingContent: () => DropdownMenu({
        trigger: "Workspace",
        items: [{ value: "personal", label: "Personal" }],
        onSelect: detail => activateWorkspace(detail.value)
    }),
    items: [{ label: "Home", href: "/" }]
});
```

Styling hooks: `[data-af-dropdown-menu]`, `[data-af-dropdown-trigger]`,
`[data-af-menu-item][aria-current="true"]` and `[data-af-navigation-control]`.
