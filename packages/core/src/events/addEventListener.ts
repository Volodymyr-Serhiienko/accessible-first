export type Cleanup = () => void;

/**
 * Adds an event listener and returns a cleanup function.
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
