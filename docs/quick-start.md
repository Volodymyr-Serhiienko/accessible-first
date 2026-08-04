# Quick Start

Accessible First components are designed to start from the smallest useful configuration. Add options only when the interface needs extra behavior, styling, or control.

<a id="component-list"></a>

## Components

- [AlertDialog](#alertdialog)
- [Accordion](#accordion)
- [Button](#button)
- [Dialog](#dialog)
- [Disclosure](#disclosure)
- [IconButton](#iconbutton)
- [Link](#link)

## Common Styling

Every composed component supports:

- `id` - Sets the DOM id.
- `className` - Adds a CSS class for custom styling.
- `attributes` - Adds native attributes, including `aria-*`, `data-*`, or `style`.

Prefer `className` for reusable styles:

```ts
Button({
    text: "Save",
    className: "save-button"
});
```

```css
.save-button {
    min-inline-size: 12rem;
}
```

For one-off styles, use `attributes.style` or the returned element:

```ts
const button = Button({ text: "Save" });

button.element.style.setProperty("min-inline-size", "12rem");
```

---

<a id="alertdialog"></a>

## AlertDialog

Use `AlertDialog` for important confirmations, especially destructive actions.

### Minimal

```ts
AlertDialog({
    trigger: "Delete project",
    title: "Delete project?",
    description: "This action cannot be undone.",
    confirmText: "Delete project",
    cancelText: "Cancel",
    onConfirm() {
        deleteProject();
    }
});
```

Defaults:

- `role: "alertdialog"`
- `modal: true`
- `trapFocus: true`
- `lockScroll` follows `modal`
- `descriptionMode: "aria"`
- `focusTarget: "cancel"`
- `confirmVariant: "danger"`
- `cancelVariant: "secondary"`
- outside pointer dismissal is disabled by default
- confirm and cancel close the alert dialog unless the handler calls `event.preventDefault()`

### Options

- `trigger` - Required trigger content.
- `title` - Required visible alert dialog title.
- `description` - Required short description.
- `confirmText` - Confirm button text.
- `cancelText` - Cancel button text.
- `confirmVariant` - Confirm button variant.
- `cancelVariant` - Cancel button variant.
- `confirmDisabled` - Disables the confirm action.
- `cancelDisabled` - Disables the cancel action.
- `focusTarget` - `"cancel"` or `"confirm"`.
- `onConfirm` - Called when the confirm action is activated.
- `onCancel` - Called when the cancel action is activated.
- `onOpenChange` - Called when the alert dialog opens or closes.
- `children` - Optional supporting content.
- `open`, `defaultOpen`, `modal`, `lockScroll`, `trapFocus`, `closeOnEscape`, `restoreFocus` - Dialog behavior options.
- `id`, `className`, `attributes` - Common DOM options.

### Styling

```ts
AlertDialog({
    trigger: "Delete project",
    title: "Delete project?",
    description: "This action cannot be undone.",
    className: "danger-confirmation"
});
```

AlertDialog reuses Dialog and Button styling hooks, including `[data-af-component="dialog"]`, `[data-af-dialog-surface]`, `[data-af-dialog-actions]`, and button `[data-af-variant]`.

[Back to component list](#component-list)

---

<a id="accordion"></a>

## Accordion

Use `Accordion` for grouped disclosure sections where users open and close related panels.

### Minimal

```ts
Accordion({
    items: [
        {
            trigger: "Account",
            panel: "Account settings and preferences."
        },
        {
            trigger: "Security",
            panel: "Password and sign-in options."
        }
    ]
});
```

Defaults:

- `headingLevel: 3`
- `panelRole: "auto"`
- `multiple: false`
- `collapsible: true`
- `loop: true`
- `variant: "default"`
- `size: "md"`
- closed by default unless an item uses `defaultOpen: true`
- no automatic panel announcement unless `announcement` is provided

### Options

Root options:

- `items` - Required list of accordion items.
- `headingLevel` - Default heading level for item headings: `2 | 3 | 4 | 5 | 6`.
- `panelRole` - `"auto"`, `"region"`, or `"none"`. `"auto"` uses `region` only for smaller accordions.
- `multiple` - Allows more than one item to be open.
- `collapsible` - Allows the last open item to close.
- `disabled` - Disables the entire accordion.
- `loop` - Arrow navigation wraps from last to first and first to last.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announcement` - Announces opened panel content when enabled.
- `onOpenChange` - Called when an item opens or closes.
- `id`, `className`, `attributes` - Common DOM options.

Item options:

- `value` - Stable item id used by controller methods.
- `trigger` - Required trigger content.
- `panel` - Required panel content.
- `headingLevel` - Overrides heading level for one item.
- `disabled` - Disables one item.
- `defaultOpen` - Opens one item initially.
- `open` - Controlled open state.
- `announcement` - Per-item announcement override.
- `id`, `className`, `attributes` - Common DOM options.

### Styling

```ts
Accordion({
    className: "settings-accordion",
    items: [...]
});
```

Useful hooks include `[data-af-component="accordion"]`, `[data-af-accordion-item]`, `[data-af-open]`, and `[data-af-disabled]`.

[Back to component list](#component-list)

---

<a id="button"></a>

## Button

Use `Button` for actions.

### Minimal

```ts
Button({
    text: "Save",
    onPress() {
        save();
    }
});
```

### Options

- `text` - Simple visible label.
- `children` - Rich content instead of `text`.
- `disabled` - Disables the button.
- `pressed` - Adds `aria-pressed` for true toggle buttons with stable labels.
- `selected` - Adds visual/action state through `data-af-selected`.
- `type` - `"button"`, `"submit"`, or `"reset"`.
- `variant` - `"primary"`, `"secondary"`, `"ghost"`, or `"danger"`.
- `size` - `"md"`.
- `onPress` - Called when the button is activated.
- `id`, `className`, `attributes` - Common DOM options.

Use `pressed` when the label stays stable:

```ts
Button({
    text: "Bold",
    pressed: false
});
```

Use `selected` for action buttons whose label changes:

```ts
Button({
    text: "Enable option",
    onPress(_event, button) {
        const selected = button.toggleSelected();

        button.setText(selected ? "Disable option" : "Enable option");
    }
});
```

### Styling

```ts
Button({
    text: "Delete",
    variant: "danger",
    className: "danger-action"
});
```

Useful hooks include `[data-af-component="button"]`, `[data-af-variant]`, `[data-af-state]`, and `[data-af-selected="true"]`.

[Back to component list](#component-list)

---

<a id="dialog"></a>

## Dialog

Use `Dialog` for modal workflows that temporarily move attention into an overlay.

### Minimal

```ts
Dialog({
    trigger: "Open dialog",
    title: "Project settings",
    description: "Change project options.",
    children: [
        P("Dialog content goes here.")
    ],
    actions: Button({
        text: "Save"
    })
});
```

Defaults:

- `role: "dialog"`
- `modal: true`
- `trapFocus: true`
- `closeOnEscape: true`
- focus returns to the trigger on close
- visible title is linked with `aria-labelledby`
- visible description is linked with `aria-describedby`
- initial focus moves to the first focusable element
- page scrolling behind the dialog is locked for modal dialogs

### Options

- `trigger` - Required trigger content.
- `title` - Required visible dialog title.
- `description` - Optional short description.
- `descriptionMode` - `"aria"` or `"content"`.
- `initialFocusTarget` - `"first"`, `"title"`, `"description"`, or `"dialog"`.
- `initialFocus` - Custom element or function for initial focus.
- `children` - Main dialog content.
- `actions` - Footer action content.
- `closeText` - Text for the default close button.
- `hideCloseButton` - Hides the default close button for specialized dialogs.
- `open` - Controlled open state.
- `defaultOpen` - Opens initially.
- `modal` - Enables modal semantics.
- `lockScroll` - Locks page scrolling while the dialog is open. Defaults to `modal`.
- `trapFocus` - Keeps Tab navigation inside the dialog.
- `closeOnEscape` - Allows Escape to close the dialog.
- `restoreFocus` - Restores focus to the opener on close.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `onOpenChange` - Called when the dialog opens or closes.
- `id`, `className`, `attributes` - Common DOM options.

### Styling

```ts
Dialog({
    trigger: "Open settings",
    title: "Settings",
    className: "settings-dialog",
    children: [...]
});
```

Useful hooks include `[data-af-component="dialog"]`, `[data-af-open]`, `[data-af-dialog-surface]`, `[data-af-dialog-title]`, `[data-af-dialog-description]`, `[data-af-dialog-body]`, and `[data-af-dialog-actions]`.

[Back to component list](#component-list)

---

<a id="disclosure"></a>

## Disclosure

Use `Disclosure` when one button reveals or hides one panel.

### Minimal

```ts
Disclosure({
    trigger: "Project details",
    panel: "This panel starts closed and opens from the trigger."
});
```

Defaults:

- closed by default
- `variant: "default"`
- `size: "md"`
- no automatic announcement unless `announcement` is provided

### Options

- `trigger` - Required trigger content.
- `panel` - Required panel content.
- `defaultOpen` - Opens the panel initially.
- `open` - Controlled open state.
- `disabled` - Disables the trigger.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announcement` - Announces opened panel content when enabled.
- `onOpenChange` - Called when open state changes.
- `id`, `className`, `attributes` - Common DOM options.

Announcement examples:

```ts
Disclosure({
    trigger: "Details",
    panel: "More information.",
    announcement: true
});
```

```ts
Disclosure({
    trigger: "Details",
    panel: "More information.",
    announcement: "Details opened."
});
```

### Styling

```ts
Disclosure({
    trigger: "Details",
    panel: "More information.",
    className: "details-box"
});
```

Useful hooks include `[data-af-component="disclosure"]`, `[data-af-disclosure-trigger]`, `[data-af-disclosure-panel]`, and `[data-af-open]`.

[Back to component list](#component-list)

---

<a id="iconbutton"></a>

## IconButton

Use `IconButton` for icon-only actions. Always provide `label` or `labelledBy`.

### Minimal

```ts
IconButton({
    label: "Save",
    icon: Icon({
        path: "M5 3h12l2 2v16H5V3Z"
    }),
    onPress() {
        save();
    }
});
```

Defaults:

- `tooltip` follows `label`
- `announceOnHover: true`
- `variant: "secondary"`
- `size: "md"`

### Options

- `label` - Accessible name for icon-only buttons.
- `labelledBy` - References visible text by id instead of `label`.
- `icon` - Icon content.
- `children` - Rich content instead of `icon`.
- `title` - Native title attribute. Avoid unless specifically needed.
- `tooltip` - Visual tooltip text. Defaults to `label`; use `null` to disable.
- `announceOnHover` - Announces tooltip/label on mouse hover.
- `selected` - Adds visual/action state through `data-af-selected`.
- `pressed` - Adds `aria-pressed` for true toggle icon buttons with stable labels.
- `disabled` - Disables the button.
- `type` - `"button"`, `"submit"`, or `"reset"`.
- `variant` - `"primary"`, `"secondary"`, `"ghost"`, or `"danger"`.
- `size` - `"md"`.
- `onPress` - Called when activated.
- `id`, `className`, `attributes` - Common DOM options.

Dynamic action example:

```ts
IconButton({
    label: "Add to favorites",
    icon: favoriteIcon(false),
    onPress(_event, button) {
        const selected = button.toggleSelected();
        const label = selected ? "Remove from favorites" : "Add to favorites";

        button.update({
            label,
            icon: favoriteIcon(selected)
        });
    }
});
```

### Styling

```ts
IconButton({
    label: "Save",
    icon: saveIcon,
    className: "toolbar-save"
});
```

Useful hooks include `[data-af-component="icon-button"]`, `[data-af-tooltip]`, `[data-af-selected="true"]`, `[data-af-variant]`, and `[data-af-state]`.

[Back to component list](#component-list)

---

<a id="link"></a>

## Link

Use `Link` for navigation.

### Minimal

```ts
Link({
    text: "Documentation",
    href: "/docs"
});
```

### Options

- `text` - Simple visible label.
- `children` - Rich content instead of `text`.
- `href` - Link destination.
- `disabled` - Makes the link unavailable.
- `external` - Marks the link as external.
- `target` - Browser target, for example `"_blank"`.
- `rel` - Link relationship.
- `current` - Sets `aria-current`.
- `variant` - `"default"`, `"muted"`, or `"standalone"`.
- `size` - `"md"`.
- `onNavigate` - Called when the link is activated.
- `id`, `className`, `attributes` - Common DOM options.

External link example:

```ts
Link({
    text: "GitHub",
    href: "https://github.com/example/project",
    external: true,
    target: "_blank"
});
```

### Styling

```ts
Link({
    text: "Skip to examples",
    href: "#examples",
    variant: "standalone",
    className: "section-link"
});
```

Useful hooks include `[data-af-component="link"]`, `[data-af-variant]`, `[data-af-state]`, and `[aria-current]`.

[Back to component list](#component-list)
