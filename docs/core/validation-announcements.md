# Validation Announcements Module

## Purpose

The Validation Announcements module centralizes screen reader feedback for validation events.

It connects form semantics with live regions without owning validation rules, visual error UI, or application wording.

## Public API

### createValidationAnnouncer()

```ts
const validation = createValidationAnnouncer({
    summaryMessage(errors) {
        return errors.length === 1
            ? "Check the highlighted field."
            : `Check ${errors.length} highlighted fields.`;
    }
});

validation.announceError({
    control: input,
    message: "Email is required."
});

validation.announceErrors([
    { control: emailInput, message: "Enter a valid email address." }
]);

validation.announceSuccess("All fields are valid.");
validation.destroy();
```

### shouldAnnounceValidationFeedback()

```ts
const shouldSpeak = shouldAnnounceValidationFeedback({
    strategy: "auto",
    announce: true,
    willMoveFocus: true,
    hasSummary: false
});
```

Use this helper in components that validate and may also move focus. It keeps future widgets aligned with the same rule as `Form`.

## Behavior

- Announces individual field errors.
- Announces validation summaries.
- Uses a custom `summaryMessage` before the built-in detailed fallback, including when there is only one error.
- Announces success messages politely when a success message is provided.
- Uses assertive announcements for errors by default.
- Can use an explicitly supplied announcer when a caller owns delivery.
- Otherwise uses a source-owned channel coordinated with other framework action and validation feedback in the same document.
- Does not own validation rules.
- Keeps validation feedback centralized.
- Allows localized summary and success messages.

## Announcement Strategy

`ValidationAnnouncementStrategy` is `false`, `true`, or `"auto"`.

- `false` keeps validation live-region feedback silent.
- `true` forces validation live-region feedback.
- `"auto"` avoids duplicate speech when validation also moves focus to the invalid control. In that case, live-region speech is used only when a short summary exists. If focus does not move, live-region feedback is allowed.

This matches the field-first model: visible field errors stay connected with controls, and event announcements describe only what changed.

## Principles

- Keep labels, descriptions, `aria-invalid`, and `aria-errormessage` intact.
- Do not remove accessibility semantics just to reduce speech.
- Avoid detailed live-region errors when focus immediately moves to the same invalid field.
- Use short summaries for workflow-level validation results.
- Use `StatusMessage` or toast for visible action results, but do not announce the same wording through several channels at once.
