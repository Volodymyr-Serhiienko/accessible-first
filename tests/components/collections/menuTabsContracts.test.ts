import {
    afterEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import { Menu } from "../../../packages/components/src/menu";
import { Tabs } from "../../../packages/components/src/tabs";

function getLiveRegionText(): string[] {
    return [
        ...document.querySelectorAll<HTMLElement>("[aria-live]")
    ].map((region) => region.textContent ?? "");
}

afterEach(() => {
    vi.useRealTimers();
});

describe("Menu and Tabs contracts", () => {
    it("keeps menu semantics, announces hover, selects enabled commands, and requests close", () => {
        vi.useFakeTimers();

        const onSelect = vi.fn();
        const onClose = vi.fn();
        const menu = Menu({
            defaultValue: "save",
            items: [
                { value: "save", label: "Save" },
                { value: "delete", label: "Delete", disabled: true }
            ],
            onSelect,
            onClose
        });

        const [save, deleteItem] = menu.items;

        if (!save || !deleteItem) {
            throw new Error("Expected composed menu items.");
        }

        document.body.append(menu.element);

        expect(menu.element.getAttribute("role")).toBe("menu");
        expect(save.item.getAttribute("role")).toBe("menuitem");
        expect(deleteItem.item.getAttribute("aria-disabled")).toBe("true");

        save.item.dispatchEvent(new Event("pointerenter"));
        vi.advanceTimersByTime(50);

        expect(getLiveRegionText()).toContain("Save");

        save.item.click();

        expect(onSelect).toHaveBeenCalledWith(
            expect.objectContaining({
                value: "save",
                text: "Save"
            }),
            menu
        );
        expect(onClose).toHaveBeenCalledOnce();

        menu.element.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true
        }));

        expect(onClose).toHaveBeenCalledTimes(2);

        menu.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });

    it("connects tabs to panels, announces hover, and ignores disabled tabs", () => {
        vi.useFakeTimers();

        const onTabChange = vi.fn();
        const tabs = Tabs({
            defaultValue: "overview",
            items: [
                {
                    value: "overview",
                    tab: "Overview",
                    panel: "Overview content."
                },
                {
                    value: "details",
                    tab: "Details",
                    panel: "Details content."
                },
                {
                    value: "disabled",
                    tab: "Disabled",
                    panel: "Unavailable content.",
                    disabled: true
                }
            ],
            onTabChange
        });

        const [overview, details, disabled] = tabs.items;

        if (!overview || !details || !disabled) {
            throw new Error("Expected composed tab items.");
        }

        document.body.append(tabs.element);

        expect(tabs.tablist.getAttribute("role")).toBe("tablist");
        expect(details.tab.getAttribute("role")).toBe("tab");
        expect(details.panel.getAttribute("role")).toBe("tabpanel");
        expect(details.tab.getAttribute("aria-controls")).toBe(details.panel.id);
        expect(details.panel.getAttribute("aria-labelledby")).toBe(details.tab.id);

        details.tab.dispatchEvent(new Event("pointerenter"));
        vi.advanceTimersByTime(50);

        expect(getLiveRegionText()).toContain("Details");

        details.tab.click();

        expect(details.tab.getAttribute("aria-selected")).toBe("true");
        expect(details.panel.hidden).toBe(false);
        expect(overview.tab.getAttribute("aria-selected")).toBe("false");
        expect(overview.panel.hidden).toBe(true);
        expect(onTabChange).toHaveBeenCalledWith(
            expect.objectContaining({
                value: "details",
                tab: details.tab,
                panel: details.panel
            }),
            tabs
        );

        disabled.tab.click();

        expect(onTabChange).toHaveBeenCalledOnce();
        expect(disabled.tab.getAttribute("aria-disabled")).toBe("true");

        tabs.destroy();

        expect(document.querySelectorAll("[data-af-live-region]"))
            .toHaveLength(0);
    });
});
