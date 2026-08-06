# Tabs

Tabs organize related content panels behind a compact tablist.

## When To Use

Use `Tabs` when several related panels share the same space and users need to switch between them.

Do not use tabs as page navigation unless the content behaves like tabbed panels and remains on the same page.

## Quick Start

```ts
Tabs({
    defaultValue: "overview",
    items: [
        {
            value: "overview",
            tab: "Overview",
            panel: "Project overview content."
        },
        {
            value: "settings",
            tab: "Settings",
            panel: "Settings content."
        }
    ],
    onTabChange(detail) {
        console.log(detail.value);
    }
});
```

Manual activation:

```ts
Tabs({
    activationMode: "manual",
    items: [
        { value: "preview", tab: "Preview", panel: "Preview content." },
        { value: "code", tab: "Code", panel: "Code content." }
    ]
});
```

## Layers

- Enhancement API: `createTabs(tablist, options)`
- Composition API: `Tabs(options)`
- Reuses: core `createTabs`, roving focus, hover announcement helper

## Behavior

- Adds `role="tablist"` to the tablist.
- Adds `role="tab"` to every tab button.
- Adds `role="tabpanel"` to every panel.
- Connects each tab to its panel with `aria-controls`.
- Connects each panel back to its tab with `aria-labelledby`.
- Keeps selected state synchronized with `aria-selected`.
- Hides inactive panels with `hidden`.
- Uses roving tabindex so only the active tab is in the normal `Tab` sequence.
- Supports horizontal and vertical arrow-key navigation.
- Supports automatic or manual activation.
- Skips disabled tabs.
- Announces tab labels on mouse hover by default for screen reader setups that do not reliably announce `role="tab"` on pointer hover.

Keyboard behavior:

- `Tab` moves focus into the current tab and then onward to panel content.
- Arrow keys move between enabled tabs.
- `Home` moves to the first enabled tab.
- `End` moves to the last enabled tab.
- In `activationMode: "automatic"`, moving focus selects the tab.
- In `activationMode: "manual"`, `Enter` or `Space` selects the focused tab.

## Options

Root options:

- `items` - Required list of tab and panel definitions.
- `value` - Controlled selected tab value.
- `defaultValue` - Initially selected tab value.
- `orientation` - `"horizontal"` or `"vertical"`. Creation-time option.
- `activationMode` - `"automatic"` or `"manual"`. Creation-time option.
- `loop` - Allows arrow navigation to wrap. Creation-time option.
- `variant` - `"default"` or `"plain"`.
- `size` - `"md"`.
- `announceOnHover` - Announces tab labels on mouse hover. Defaults to `true`.
- `onTabChange` - Called when the selected tab changes.
- common composition options from [foundation.md](./foundation.md#common-composition-options).

Item options:

- `value` - Stable value for selecting and updating the tab.
- `tab` - Required tab label content.
- `panel` - Required panel content.
- `disabled` - Disables one tab.
- `defaultSelected` - Selects an item initially when `value` and `defaultValue` are not provided.
- `tabOptions` - Common DOM options for the tab button.
- `panelOptions` - Common DOM options for the panel.
- `announceOnHover` - Per-tab hover announcement override.
- `hoverAnnouncement` - Custom hover announcement text for one tab.

## Update Notes

`orientation`, `activationMode`, `loop`, and `defaultValue` are creation-time options.

Change the selected tab through `value` or controller methods:

```ts
const tabs = Tabs({
    items: [
        { value: "one", tab: "One", panel: "One panel." },
        { value: "two", tab: "Two", panel: "Two panel." }
    ]
});

tabs.setCurrentValue("two", { focus: true });
```

Item updates are partial and matched by index:

```ts
tabs.update({
    items: [
        { tab: "Updated tab" },
        { disabled: true }
    ]
});
```

## Styling

Useful hooks include `[data-af-composition="tabs"]`, `[data-af-component="tabs"]`, `[data-af-tabs-tab]`, `[data-af-tabs-panel]`, `[aria-selected]`, `[data-af-orientation]`, and `[data-af-activation-mode]`.

```ts
Tabs({
    className: "settings-tabs",
    items: [...]
});
```

## Manual Checks

- Tab names are announced.
- Selected state is announced.
- Arrow keys move between enabled tabs.
- Disabled tabs cannot be selected.
- Manual activation waits for `Enter` or `Space`.
- Focus indicator is visible.
- Panel content is reachable after the tablist.
- Mouse hover announces tab labels when `announceOnHover` is enabled.
- Touch targets are comfortable on mobile.
