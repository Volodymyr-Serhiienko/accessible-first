import { focusFirst } from "./focusFirst";
import { restoreFocus } from "./restoreFocus";
import { getFocusableElements } from "./getFocusableElements";

export function createFocusTrap(
    container: HTMLElement
) {

    let active = false;

    let paused = false;

    let previousFocus: HTMLElement | null = null;

    function handleKeyDown(event: KeyboardEvent): void {

        if (!active || paused) {
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const elements = getFocusableElements(container);

        if (elements.length === 0) {
            return;
        }

        const first = elements[0];

        const last = elements[elements.length - 1];

        if (!first || !last) {
            return;
        }

        const current = document.activeElement;

        if (event.shiftKey && current === first) {

            event.preventDefault();

            last.focus();

            return;
        }

        if (!event.shiftKey && current === last) {

            event.preventDefault();

            first.focus();
        }
    }

    return {

        activate() {

            if (active) {
                return;
            }

            previousFocus = document.activeElement as HTMLElement | null;

            active = true;

            container.addEventListener(
                "keydown",
                handleKeyDown
            );

            focusFirst(container);
        },

        deactivate() {

            if (!active) {
                return;
            }

            active = false;

            paused = false;

            container.removeEventListener(
                "keydown",
                handleKeyDown
            );

            restoreFocus(previousFocus);
        },

        pause() {

            paused = true;

        },

        resume() {

            paused = false;

        },

        isActive() {

            return active;

        }

    };

}