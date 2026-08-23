# Validation Announcements Module

## Purpose

The Validation Announcements module announces form validation feedback to assistive technologies.

It connects form semantics with live regions without owning validation rules.

## Public API

### createValidationAnnouncer()

```ts
const validation = createValidationAnnouncer();

validation.announceError({
    control: input,
    message: "Email is required"
});

validation.announceSuccess("All fields are valid.");
validation.destroy();
```

---

## Behavior

* Announces individual field errors
* Announces validation summaries
* Announces success messages politely when a success message is provided
* Uses assertive announcements for errors by default
* Can use an existing announcer or create its own
* Does not own validation rules
* Keeps validation feedback centralized
* Allows localized summary and success messages

---

## Principles

* No framework dependency
* Uses the Live Region module
* Does not own validation logic
* Supports field-level and summary announcements
* Keeps screen reader feedback centralized
