import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "../../../packages/components/src/dropdown-menu";
import { ResponsiveNavigation } from "../../../packages/components/src/responsive-navigation";

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

function createDropdown(onSelect = vi.fn()) {
    const dropdown = DropdownMenu({
        trigger: "Language", value: "en",
        items: [
            { value: "en", label: "English" },
            { value: "de", label: "German" },
            { value: "pl", label: "Polish", disabled: true }
        ], onSelect
    });
    document.body.append(dropdown.element);
    vi.spyOn(dropdown.trigger, "getBoundingClientRect").mockReturnValue({ x: 10, y: 10, top: 10, left: 10, right: 110, bottom: 54, width: 100, height: 44, toJSON() {} });
    vi.spyOn(dropdown.trigger, "getClientRects").mockReturnValue([dropdown.trigger.getBoundingClientRect()] as unknown as DOMRectList);
    return dropdown;
}
function key(element: HTMLElement, value: string) {
    const event = new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return event;
}

describe("DropdownMenu", () => {
    it("does not open on focus or commit arrow navigation, and restores focus before activation", () => {
        const onSelect = vi.fn(() => expect(document.activeElement).toBe(dropdown.trigger));
        const dropdown = createDropdown(onSelect);
        dropdown.trigger.focus();
        expect(dropdown.isOpen()).toBe(false);
        expect(dropdown.trigger.getAttribute("aria-haspopup")).toBe("menu");
        expect(dropdown.trigger.getAttribute("aria-controls")).toBe(dropdown.menu.element.id);
        dropdown.trigger.click();
        expect(dropdown.isOpen()).toBe(true);
        expect(document.activeElement).toBe(dropdown.menu.getItem("en")?.item);
        key(dropdown.menu.getItem("en")!.item, "ArrowDown");
        expect(document.activeElement).toBe(dropdown.menu.getItem("de")?.item);
        expect(dropdown.getValue()).toBe("en");
        expect(onSelect).not.toHaveBeenCalled();
        key(dropdown.menu.getItem("de")!.item, "Enter");
        expect(onSelect).toHaveBeenCalledOnce();
        expect(dropdown.isOpen()).toBe(false);
        expect(dropdown.getValue()).toBe("en");
        dropdown.setValue("de");
        expect(dropdown.menu.getItem("de")?.item.getAttribute("aria-current")).toBe("true");
        dropdown.destroy();
    });

    it("opens at first/last enabled item and supports Escape, Tab, Space and disabled triggers", () => {
        const onSelect = vi.fn();
        const dropdown = createDropdown(onSelect);
        key(dropdown.trigger, "ArrowUp");
        expect(document.activeElement).toBe(dropdown.menu.getItem("de")?.item);
        key(dropdown.menu.getItem("de")!.item, "Escape");
        expect(dropdown.isOpen()).toBe(false);
        expect(document.activeElement).toBe(dropdown.trigger);
        key(dropdown.trigger, "ArrowDown");
        expect(document.activeElement).toBe(dropdown.menu.getItem("en")?.item);
        const tab = key(dropdown.menu.getItem("en")!.item, "Tab");
        expect(tab.defaultPrevented).toBe(false);
        expect(dropdown.isOpen()).toBe(false);
        expect(document.activeElement).toBe(dropdown.trigger);
        dropdown.open();
        key(dropdown.menu.getItem("en")!.item, " ");
        expect(onSelect).toHaveBeenCalledOnce();
        dropdown.setDisabled(true);
        dropdown.trigger.click();
        expect(dropdown.isOpen()).toBe(false);
        expect(dropdown.trigger.disabled).toBe(true);
        dropdown.destroy();
    });

    it("replaces items, dismisses outside without stealing focus, and destroys owned menus", () => {
        const onSelect = vi.fn();
        const dropdown = createDropdown(onSelect);
        const original = dropdown.menu;
        dropdown.setItems([{ value: "nb", label: "Norwegian" }]);
        expect(original.isDestroyed()).toBe(true);
        expect(dropdown.menu.items).toHaveLength(1);
        expect(dropdown.trigger.getAttribute("aria-controls")).toBe(dropdown.menu.element.id);
        dropdown.open();
        const outside = document.createElement("button");
        document.body.append(outside);
        outside.focus();
        expect(dropdown.isOpen()).toBe(false);
        expect(document.activeElement).toBe(outside);
        const current = dropdown.menu;
        dropdown.destroy();
        dropdown.destroy();
        expect(current.isDestroyed()).toBe(true);
    });
});

describe("leading navigation content", () => {
    it("creates independent controls before native links and disposes them on rebuild", () => {
        const controls: ReturnType<typeof DropdownMenu>[] = [];
        const factory = () => {
            const dropdown = DropdownMenu({ trigger: "Language", items: [{ value: "en", label: "English" }] });
            controls.push(dropdown);
            return dropdown;
        };
        const navigation = ResponsiveNavigation({
            leadingContent: factory,
            items: [{ label: "Lessons", href: "#lessons" }, { label: "Settings", href: "#settings" }]
        });
        document.body.append(navigation.element);
        expect(controls).toHaveLength(2);
        expect(controls[0]!.element).not.toBe(controls[1]!.element);
        for (const list of [navigation.desktopNavigation, navigation.mobileNavigation]) {
            expect(list.element.firstElementChild?.hasAttribute("data-af-navigation-control")).toBe(true);
            expect(list.items[0]!.link.element.tagName).toBe("A");
            expect(list.element.getAttribute("role")).toBeNull();
        }
        navigation.setItems([{ label: "Home", href: "#home" }]);
        expect(controls).toHaveLength(4);
        expect(controls[0]!.menu.isDestroyed()).toBe(true);
        expect(controls[1]!.menu.isDestroyed()).toBe(true);
        navigation.update({ leadingContent: null });
        expect(controls[2]!.menu.isDestroyed()).toBe(true);
        expect(controls[3]!.menu.isDestroyed()).toBe(true);
        navigation.destroy();
    });
});
