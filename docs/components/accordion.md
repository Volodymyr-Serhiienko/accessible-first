# Accordion

Accordion groups related disclosure items and provides keyboard navigation between item triggers.

## Status

Initial component implementation.

## Layers

- Enhancement API: `createAccordion(element, options)`
- Composition API: `Accordion(options)`
- Reuses: `createDisclosure`, `Disclosure`

## Behavior

Accordion items use disclosure semantics:

- each trigger controls one panel;
- triggers expose `aria-expanded`;
- triggers reference panels through `aria-controls`;
- panels are hidden when closed.

The accordion keeps every trigger in the normal page `Tab` sequence.

Keyboard behavior:

- `Tab` moves through all accordion triggers and other focusable page controls.
- `Enter` / `Space` toggles the focused accordion trigger.
- `ArrowDown` / `ArrowUp` may move focus between triggers when the browser receives those keys.
- `Home` / `End` may move focus to the first or last trigger.

Arrow key support is an enhancement, not the only navigation path. Screen readers may use arrow keys for their own reading cursor.

In the composition API, each accordion trigger is wrapped in a native heading element.

By default, composition accordions use `h3` for item headings. This can be changed with `headingLevel`.

Panels use `role="region"` and `aria-labelledby` in `panelRole: "auto"` mode when the accordion has a small enough number of panels to avoid landmark proliferation.

Accordion reuses Disclosure announcement behavior. If `announcement` is enabled, opening an item can announce the panel text or a custom message.

## Composition Example

```ts
Accordion({
    items: [
        {
            value: "first",
            trigger: "First item",
            panel: "First panel content.",
            defaultOpen: true
        },
        {
            value: "second",
            trigger: "Second item",
            panel: "Second panel content."
        }
    ],
    onOpenChange(detail) {
        console.log(detail.value, detail.open);
    }
});
```

## Options

* items: accordion item definitions.
* multiple: allows more than one item to be open.
* collapsible: allows the last open item to close.
* disabled: disables all items.
* loop: loops keyboard navigation.
* variant: visual variant.
* size: size token.
* headingLevel: native heading level for composition item headers. Creation-time only.
* panelRole: `"auto"`, `"region"`, or `"none"` for composition panel landmark behavior.
* announcement: optional live-region output when an item opens. Can be set globally or per item.

## Update Notes

`headingLevel` is creation-time only because it creates native heading elements.

Item updates are partial:

```ts
accordion.update({
    items: [
        { open: true },
        { disabled: true }
    ]
});
```

## Manual Checks

* Trigger names are announced by screen readers.
* Expanded/collapsed state is announced.
* Arrow keys move between triggers.
* Disabled items cannot be activated.
* Focus indicator is visible.
* Touch targets are comfortable on mobile.
