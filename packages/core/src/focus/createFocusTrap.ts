import {
    focusFirst,
    focusElement,
    restoreFocus,
    getFocusableElements
 } from "../focus";
import { isTabKey } from "../keyboard";
import { isHTMLElement } from "../dom"

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

        if (!isTabKey(event)) {
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

            focusElement(last);

            return;
        }

        if (!event.shiftKey && current === last) {

            event.preventDefault();

            focusElement(first);
        }
    }

    return {

        activate() {

            if (active) {
                return;
            }

            const activeElement = document.activeElement;
            previousFocus = isHTMLElement(activeElement) ? activeElement : null;

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