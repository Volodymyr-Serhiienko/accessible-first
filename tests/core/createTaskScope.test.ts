import { describe, expect, it } from "vitest";
import { createTaskScope } from "../../packages/core/src/task";

describe("createTaskScope", () => {
    it("cleans every resource and aborts even when one unsubscribe fails", () => {
        const scope = createTaskScope();
        const task = scope.begin();
        const events: string[] = [];
        const failure = new Error("unsubscribe failed");
        task.addCleanup(() => { events.push("first"); throw failure; });
        task.addCleanup(() => { events.push("second"); });
        task.signal.addEventListener("abort", () => events.push("abort"));
        expect(() => scope.cancel()).toThrow(failure);
        expect(events).toEqual(["first", "second", "abort"]);
        expect(task.signal.aborted).toBe(true);
        expect(scope.begin().isCurrent()).toBe(true);
        scope.destroy();
    });

    it("does not overwrite a newer task started reentrantly by a cleanup", () => {
        const scope = createTaskScope();
        const first = scope.begin();
        let newer: ReturnType<typeof scope.begin> | undefined;
        first.addCleanup(() => { newer = scope.begin(); });
        const obsolete = scope.begin();
        expect(obsolete.signal.aborted).toBe(true);
        expect(obsolete.isCurrent()).toBe(false);
        expect(newer?.isCurrent()).toBe(true);
        scope.destroy();
        expect(newer?.signal.aborted).toBe(true);
    });

    it("unsubscribes before aborting and invalidates the previous task", () => {
        const scope = createTaskScope();
        const first = scope.begin();
        const events: string[] = [];
        first.addCleanup(() => events.push("cleanup"));
        first.signal.addEventListener("abort", () => events.push("abort"));
        const next = scope.begin();
        expect(events).toEqual(["cleanup", "abort"]);
        expect(first.isCurrent()).toBe(false);
        expect(next.isCurrent()).toBe(true);
        first.addCleanup(() => events.push("late"));
        expect(events[events.length - 1]).toBe("late");
        scope.destroy();
        expect(next.isCurrent()).toBe(false);
        expect(scope.begin().signal.aborted).toBe(true);
    });
});
