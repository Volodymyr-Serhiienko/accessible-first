import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";
import {
    ResponsiveNavigation
} from "../../../packages/components/src/responsive-navigation";

describe("ResponsiveNavigation", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("closes the mobile panel and restores focus to its trigger", () => {
        const navigation = ResponsiveNavigation({
            trigger: "Sections",
            closeButton: "Close menu",
            items: [
                { label: "Home", href: "#home" },
                { label: "Lessons", href: "#lessons" }
            ]
        });

        document.body.append(navigation.element);

        navigation.mobileDisclosure.trigger.focus();
        navigation.mobileDisclosure.trigger.click();

        expect(navigation.mobileDisclosure.isOpen()).toBe(true);

        navigation.mobileCloseButton.element.click();
        vi.runAllTimers();

        expect(navigation.mobileDisclosure.isOpen()).toBe(false);
        expect(document.activeElement)
            .toBe(navigation.mobileDisclosure.trigger);

        navigation.destroy();
    });
});
