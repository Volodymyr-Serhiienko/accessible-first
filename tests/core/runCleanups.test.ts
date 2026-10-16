import { describe, expect, it } from "vitest";
import { runCleanups } from "../../packages/core/src/events";

describe("runCleanups", () => {
    it("preserves order, runs survivors and propagates the first failure", () => {
        const events: number[] = [];
        const first = new Error("first");
        expect(() => runCleanups([
            () => { events.push(1); throw first; },
            () => { events.push(2); throw new Error("second"); },
            () => { events.push(3); }
        ])).toThrow(first);
        expect(events).toEqual([1, 2, 3]);
    });

    it("does not mistake a thrown undefined for successful cleanup", () => {
        let caught = false;
        let completed = false;
        try { runCleanups([() => { throw undefined; }, () => { completed = true; }]); }
        catch (error) { caught = true; expect(error).toBeUndefined(); }
        expect(caught).toBe(true);
        expect(completed).toBe(true);
    });
});
