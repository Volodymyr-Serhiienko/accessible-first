/**
 * A function type intended for executing cleanup side effects.
 * Commonly used to remove event listeners, clear timers, or release resources.
 */
export type Cleanup = () => void;

/**
 * Adds an event listener and returns a cleanup function.
 * 
 * @param target - The event target (e.g., DOM element, window, document) to attach the listener to.
 * @param type - A string representing the event type to listen for.
 * @param listener - The callback function executed when the event is triggered.
 * @param options - An optional object or boolean specifying characteristics about the event listener.
 * @returns A cleanup function that removes the event listener when invoked.
 */
export function addEventListener<TEvent extends Event>(
    target: EventTarget,
    type: string,
    listener: (event: TEvent) => void,
    options?: AddEventListenerOptions | boolean
): Cleanup {
    const eventListener: EventListener = (event) => {
        listener(event as TEvent);
    };

    target.addEventListener(type, eventListener, options);

    return () => {
        target.removeEventListener(type, eventListener, options);
    };
}
