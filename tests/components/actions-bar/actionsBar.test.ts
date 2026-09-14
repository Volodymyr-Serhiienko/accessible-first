import {
    describe,
    expect,
    it
} from "vitest";
import { ActionsBar } from "../../../packages/components/src/actions-bar";
import { Button } from "../../../packages/components/src/button";

describe("ActionsBar", () => {
    it("opts into full wrapped rows without changing native action semantics", () => {
        const actions = ActionsBar({
            label: "Speech actions",
            align: "start",
            fillOnWrap: true,
            primary: [
                Button({ text: "Listen" }),
                Button({ text: "Pause" }),
                Button({ text: "Stop" })
            ]
        });

        document.body.append(actions.element);

        expect(actions.element.getAttribute("role")).toBe("group");
        expect(actions.element.getAttribute("aria-label")).toBe("Speech actions");
        expect(actions.element.getAttribute("data-af-fill-on-wrap")).toBe("true");
        expect(actions.primarySlot.querySelectorAll("button")).toHaveLength(3);

        actions.update({ fillOnWrap: false });

        expect(actions.element.hasAttribute("data-af-fill-on-wrap")).toBe(false);

        actions.destroy();
    });
});
