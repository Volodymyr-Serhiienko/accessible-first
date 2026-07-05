# ARIA Module

## Purpose

The ARIA module provides small helpers for applying accessible roles, states, properties, and relationships.

It does not decide component behavior. It only gives higher-level modules a consistent way to write ARIA attributes.

## Public API

### setRole()

Sets or removes the ARIA role attribute on a specified element.

```ts
setRole(element: HTMLElement, role: string | null | undefined): void
```

---

### setAriaAttribute()

Sets or removes an ARIA attribute on a specified element based on the provided value.

```ts
setAriaAttribute(element: HTMLElement, name: AriaAttributeName, value: AriaAttributeValue): void
```

---

### setAriaReferences()

Sets an ARIA attribute that references other elements (e.g., aria-labelledby, aria-controls) 
by combining their IDs into a space-separated string.

```ts
setAriaReferences(element: HTMLElement, name: AriaAttributeName, references: AriaReferences,prefix = "af"): void
```

---

### Relationship helpers

- setAriaControls()
- setAriaLabelledBy()
- setAriaDescribedBy()

```ts
setAriaControls(element: HTMLElement, controlledElement: AriaReference): void
setAriaLabelledBy(element: HTMLElement, labels: AriaReferences): void
setAriaDescribedBy(element: HTMLElement, descriptions: AriaReferences): void
```

---

### State helpers

- setAriaHidden()
- setAriaModal()
- setAriaExpanded()
- setAriaDisabled()

```ts
setAriaHidden(element: HTMLElement, hidden: boolean | null | undefined): void
setAriaModal(element: HTMLElement, modal: boolean | null | undefined): void
setAriaExpanded(element: HTMLElement, expanded: boolean | null | undefined): void
setAriaDisabled(element: HTMLElement, disabled: boolean | null | undefined): void
```

---

## Principles

- No framework dependency
- No component assumptions
- Stable attribute writing
- Automatic ID creation for element references
