# Component Foundation

Component Foundation defines the shared rules for Accessible First components.

Components should compose core behavior modules instead of duplicating accessibility logic.

## Defaults

Every component should aim for:

- native HTML first;
- keyboard support where expected;
- visible focus states;
- correct ARIA names, relationships, and states;
- disabled state behavior;
- cleanup on `destroy()`;
- stable data attributes for styling and debugging;
- no framework dependency.

## Common Composition Options

Composed components and layout helpers support common DOM options:

- `id` sets the DOM id.
- `className` adds a CSS class.
- `attributes` adds native attributes, including `aria-*`, `data-*`, and `style`.

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

For one-off adjustments, use native attributes or the returned element:

```ts
const button = Button({ text: "Save" });

button.element.style.setProperty("min-inline-size", "12rem");
```

## Lifecycle

Every component controller should expose:

```ts
destroy(): void;
isDestroyed(): boolean;
```

Components may expose additional methods such as `update()`, `open()`, `close()`, `setDisabled()`, or selection helpers depending on their behavior.

## Data Attributes

Components use stable data attributes as styling and debugging hooks:

```html
data-af-component="button"
data-af-state="ready"
```

Data attributes are not accessibility replacements. ARIA and native HTML semantics remain the accessibility source.

## Default Styles

The public style entry point is `packages/components/src/styles/index.css`.

Internally, styles are split by concern:

- `tokens.css` - theme tokens and shared CSS custom properties;
- `page.css` - page-level utilities such as skip links;
- `composition.css` - semantic composition and layout helper styles;
- `components/*.css` - component-specific default styles.

Applications can import the single entry point or copy only the pieces they need later when package distribution is formalized.

## Shared Helpers

Shared helpers keep repeated accessibility behavior out of individual components.

`createHoverAnnouncement(element, options)` announces an element label through a polite live region when a mouse pointer enters the element. It does not create a visual tooltip.

Use it for controls that already have visible text but may not be announced reliably by some screen reader and pointer-hover combinations.

## Descriptions And Announcements

Interactive components should keep visible explanation and live-region speech separate.

Use `description` for helper text that is visible to everyone and can be connected with `aria-describedby` when appropriate.

Use `announcement` when opening a component should be announced without moving focus. Prefer concise messages for non-modal expandable or floating UI such as Disclosure, Accordion items, and Popover.

Future expandable components should consider this pattern when it helps users understand what opened and what to do next.

## Callback Shape

Composition callbacks may receive the component instance when that makes state updates easier:

```ts
Button({
    text: "Enable option",
    onPress(_event, button) {
        const selected = button.toggleSelected();

        button.setText(selected ? "Disable option" : "Enable option");
    }
});
```

This avoids unnecessary external variables for common self-updating controls.

## Principles

- Components compose lower-level behavior.
- Components should preserve user-authored markup.
- Components should restore mutations on `destroy()`.
- Components should be configurable without losing accessible defaults.
- Shared helpers should be extracted when the same accessibility workaround appears in more than one component.
