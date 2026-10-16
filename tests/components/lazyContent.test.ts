import { describe, expect, it, vi } from "vitest";
import { Button, LazyContent, Stack } from "../../packages/components/src";
import type { LazyContentFactory } from "../../packages/components/src";

function deferred() {
    let resolve!: (factory: LazyContentFactory) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<LazyContentFactory>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

describe("LazyContent", () => {
    it("keeps route focus, exposes pending and owns the loaded view", async () => {
        const request = deferred();
        const destroy = vi.fn();
        const previous = Button({ text: "Navigation" });
        document.body.append(previous.element); previous.element.focus();
        const view = LazyContent({ load: () => request.promise, pendingContent: () => "Wait", failureContent: () => "Failed", pendingOptions: { pendingMessage: false } });
        document.body.append(view.element);
        expect(view.element.getAttribute("aria-busy")).toBe("true");
        expect(view.element.textContent).toBe("Wait");
        request.resolve(() => ({ element: document.createElement("section"), destroy }));
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("ready"));
        expect(document.activeElement).toBe(previous.element);
        expect(view.element.hasAttribute("aria-busy")).toBe(false);
        view.destroy(); view.destroy();
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(view.element.isConnected).toBe(false);
    });

    it("aborts destruction and never creates late content", async () => {
        const request = deferred(); let signal!: AbortSignal;
        const factory = vi.fn(() => "Obsolete");
        const view = LazyContent({ load: value => { signal = value; return request.promise; }, pendingContent: () => "Wait", failureContent: () => "Failed" });
        view.destroy();
        expect(signal.aborted).toBe(true); expect(view.isDestroyed()).toBe(true);
        request.resolve(factory);
        await Promise.resolve();
        expect(factory).not.toHaveBeenCalled();
        view.reload();
        expect(factory).not.toHaveBeenCalled();
    });

    it("ignores the old failure after a replacement and destroys the old ready content", async () => {
        const first = deferred(); const second = deferred(); const third = deferred();
        const failure = vi.fn(() => "Failed");
        const load = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise);
        const view = LazyContent({ load, pendingContent: () => "Wait", failureContent: failure });
        view.reload(); first.reject(new Error("Old failure"));
        const destroy = vi.fn();
        second.resolve(() => ({ element: document.createElement("section"), destroy }));
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("ready"));
        expect(failure).not.toHaveBeenCalled();
        view.reload(); expect(destroy).toHaveBeenCalledTimes(1);
        third.resolve(() => "Current");
        await vi.waitFor(() => expect(view.element.textContent).toBe("Current"));
        view.destroy();
    });

    it("shows a load error and moves retry focus to the live slot, not the body", async () => {
        const first = deferred(); const second = deferred();
        const view = LazyContent({ load: vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise),
            pendingContent: () => "Wait", failureContent: (_error, retry) => Stack("Failed", Button({ text: "Retry", onPress: retry })) });
        document.body.append(view.element);
        first.reject(new Error("Network"));
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("error"));
        const retry = view.element.querySelector("button")!;
        retry.focus(); retry.click();
        expect(document.activeElement).toBe(view.element);
        second.resolve(() => "Ready");
        await vi.waitFor(() => expect(view.element.textContent).toBe("Ready"));
        expect(document.activeElement).toBe(view.element);
        view.destroy();
    });

    it("treats construction errors as load failures", async () => {
        const request = deferred(); const failure = vi.fn(() => "Failed");
        const view = LazyContent({ load: () => request.promise, pendingContent: () => "Wait", failureContent: failure });
        request.resolve(() => { throw new Error("Construction"); });
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("error"));
        expect(failure).toHaveBeenCalledOnce(); view.destroy();
    });

    it("disposes a factory result when construction destroys its own slot", async () => {
        const request = deferred(); const destroy = vi.fn();
        const view = LazyContent({ load: () => request.promise, pendingContent: () => "Wait", failureContent: () => "Failed" });
        request.resolve(() => { view.destroy(); return { element: document.createElement("section"), destroy }; });
        await vi.waitFor(() => expect(destroy).toHaveBeenCalledTimes(1));
        expect(view.element.childElementCount).toBe(0);
    });

    it("serializes reloads from pending cleanup and disposes the invalidated result", async () => {
        const first = deferred(); const second = deferred(); const destroy = vi.fn();
        const load = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        let attempt = 0;
        const view = LazyContent({ load, pendingContent: () => ++attempt === 1
            ? { element: document.createElement("p"), destroy: () => view.reload() } : "Wait", failureContent: () => "Failed" });
        first.resolve(() => ({ element: document.createElement("section"), destroy }));
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2));
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(view.element.dataset.afLazyState).toBe("pending");
        second.resolve(() => "Current");
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("ready"));
        expect(view.element.textContent).toBe("Current");
        view.destroy();
    });

    it("releases an unmounted result if replacement cleanup fails", async () => {
        const request = deferred(); const destroy = vi.fn();
        const view = LazyContent({ load: () => request.promise,
            pendingContent: () => ({ element: document.createElement("p"), destroy: () => { throw new Error("Cleanup"); } }),
            failureContent: () => "Failed" });
        request.resolve(() => ({ element: document.createElement("section"), destroy }));
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("error"));
        expect(destroy).toHaveBeenCalledTimes(1); expect(view.element.textContent).toBe("Failed");
        view.destroy();
    });

    it("finishes teardown and removes the host even if a child cleanup fails", async () => {
        const request = deferred(); const sibling = vi.fn();
        const view = LazyContent({ load: () => request.promise, pendingContent: () => "Wait", failureContent: () => "Failed" });
        document.body.append(view.element);
        request.resolve(() => [
            { element: document.createElement("section"), destroy: () => { throw new Error("Cleanup"); } },
            { element: document.createElement("section"), destroy: sibling }
        ]);
        await vi.waitFor(() => expect(view.element.dataset.afLazyState).toBe("ready"));
        expect(() => view.destroy()).toThrow("Cleanup");
        expect(sibling).toHaveBeenCalledOnce(); expect(view.element.isConnected).toBe(false);
        expect(view.isDestroyed()).toBe(true); expect(() => view.destroy()).not.toThrow();
    });
});
