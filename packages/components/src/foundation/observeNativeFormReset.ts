import { addEventListener, type Cleanup } from "../../../core/src/events";

type NativeFormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Refreshes derived state after the browser's uncanceled reset default action. */
export function observeNativeFormReset(
    element: HTMLElement,
    getControls: () => readonly NativeFormControl[],
    sync: () => void
): Cleanup {
    let destroyed = false;
    const remove = addEventListener<Event>(element.ownerDocument, "reset", event => {
        const form = event.target;
        if (!getControls().some(control => control.form === form)) return;

        queueMicrotask(() => {
            if (!destroyed && !event.defaultPrevented
                && getControls().some(control => control.form === form)) sync();
        });
    }, { capture: true });

    return () => {
        destroyed = true;
        remove();
    };
}
