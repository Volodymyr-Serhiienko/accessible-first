import { afterEach, vi } from "vitest";

// jsdom intentionally has no scrolling implementation.
Object.defineProperty(window, "scrollTo", {
    configurable: true,
    writable: true,
    value: () => undefined
});

afterEach(() => {
    vi.useRealTimers();

    document.body.replaceChildren();
    document.documentElement.removeAttribute("data-af-theme");
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");

    window.localStorage.clear();
    window.sessionStorage.clear();
});
