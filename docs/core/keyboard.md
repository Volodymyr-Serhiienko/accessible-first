# Keyboard Module

## Purpose

The Keyboard module provides simple and consistent utilities for handling keyboard events.

Instead of comparing key names throughout the codebase, components use dedicated helper functions. This improves readability, reduces duplication, and provides a single place to update keyboard behavior if browser standards evolve.

---

## Principles

* Accessibility first.
* Framework independent.
* Native browser behavior.
* Predictable API.
* No external dependencies.
* One function for one key.

---

## Public API

### isTabKey()

Returns `true` if the pressed key is **Tab**.

```ts
isTabKey(event: KeyboardEvent): boolean
```

---

### isEscapeKey()

Returns `true` if the pressed key is **Escape**.

```ts
isEscapeKey(event: KeyboardEvent): boolean
```

---

### isEnterKey()

Returns `true` if the pressed key is **Enter**.

```ts
isEnterKey(event: KeyboardEvent): boolean
```

---

### isSpaceKey()

Returns `true` if the pressed key is **Space**.

Supports both modern and legacy browser values.

```ts
isSpaceKey(event: KeyboardEvent): boolean
```

---

### isArrowUpKey()

Returns `true` if the pressed key is **Arrow Up**.

```ts
isArrowUpKey(event: KeyboardEvent): boolean
```

---

### isArrowDownKey()

Returns `true` if the pressed key is **Arrow Down**.

```ts
isArrowDownKey(event: KeyboardEvent): boolean
```

---

### isArrowLeftKey()

Returns `true` if the pressed key is **Arrow Left**.

```ts
isArrowLeftKey(event: KeyboardEvent): boolean
```

---

### isArrowRightKey()

Returns `true` if the pressed key is **Arrow Right**.

```ts
isArrowRightKey(event: KeyboardEvent): boolean
```

---

### isHomeKey()

Returns `true` if the pressed key is **Home**.

```ts
isHomeKey(event: KeyboardEvent): boolean
```

---

### isEndKey()

Returns `true` if the pressed key is **End**.

```ts
isEndKey(event: KeyboardEvent): boolean
```

---

### isPageUpKey()

Returns `true` if the pressed key is **Page Up**.

```ts
isPageUpKey(event: KeyboardEvent): boolean
```

---

### isPageDownKey()

Returns `true` if the pressed key is **Page Down**.

```ts
isPageDownKey(event: KeyboardEvent): boolean
```

---

### isDeleteKey()

Returns `true` if the pressed key is **Delete**.

```ts
isDeleteKey(event: KeyboardEvent): boolean
```

---

### isBackspaceKey()

Returns `true` if the pressed key is **Backspace**.

```ts
isBackspaceKey(event: KeyboardEvent): boolean
```

---

## Typical use cases

The Keyboard module is used internally by:

* Dialog
* Menu
* Combobox
* Listbox
* Tabs
* TreeView
* Accordion
* Command Palette

---

## Future improvements

Planned enhancements include:

* Modifier key helpers
* Keyboard shortcut utilities
* International keyboard considerations

---

## Philosophy

Keyboard behavior should be explicit, readable, and reusable.

Instead of checking key values throughout the codebase, components rely on small, well-defined primitives that make intent immediately clear.
