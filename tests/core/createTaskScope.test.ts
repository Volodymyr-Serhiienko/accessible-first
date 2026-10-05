import { describe, expect, it } from "vitest";
import { createTaskScope } from "../../packages/core/src/task";

describe("createTaskScope", () => {
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
