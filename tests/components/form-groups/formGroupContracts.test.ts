import {
    describe,
    expect,
    it
} from "vitest";
import { Button } from "../../../packages/components/src/button";
import { FieldGroup } from "../../../packages/components/src/field-group";
import { FormSection } from "../../../packages/components/src/form-section";
import { SettingsGroup } from "../../../packages/components/src/settings-group";

describe("Form grouping contracts", () => {
    it("keeps FieldGroup as a native fieldset with important group context", () => {
        const group = FieldGroup({
            label: "Notification channels",
            description: "Choose at least one channel for urgent updates.",
            required: true,
            invalid: true,
            errorMessage: "Choose at least one notification channel.",
            children: "Channel controls."
        });

        document.body.append(group.element);

        expect(group.element.localName).toBe("fieldset");
        expect(group.element.getAttribute("role")).toBeNull();
        expect(group.legend.localName).toBe("legend");
        expect(group.legend.hasAttribute("data-af-required")).toBe(true);
        expect(group.element.getAttribute("aria-required")).toBe("true");
        expect(group.element.getAttribute("aria-invalid")).toBe("true");
        expect(group.element.getAttribute("aria-describedby"))
            .toBe(group.description.id);
        expect(group.element.getAttribute("aria-errormessage"))
            .toBe(group.errorMessage.id);
        expect(group.description.hidden).toBe(false);
        expect(group.errorMessage.hidden).toBe(false);

        group.update({ descriptionMode: "content" });

        expect(group.description.hidden).toBe(false);
        expect(group.element.getAttribute("aria-describedby")).toBeNull();
        expect(group.element.getAttribute("aria-errormessage"))
            .toBe(group.errorMessage.id);

        group.destroy();
    });

    it("keeps FormSection description as visible content unless aria speech is requested", () => {
        const section = FormSection({
            title: "Account profile",
            description: "These fields describe the visible user profile.",
            headingLevel: 2,
            children: "Profile fields.",
            actions: Button({
                text: "Save profile",
                type: "submit",
                variant: "primary"
            })
        });

        document.body.append(section.element);

        expect(section.element.localName).toBe("section");
        expect(section.heading.localName).toBe("h2");
        expect(section.element.getAttribute("aria-labelledby"))
            .toBe(section.heading.id);
        expect(section.description.hidden).toBe(false);
        expect(section.element.getAttribute("aria-describedby")).toBeNull();
        expect(section.actions.hidden).toBe(false);

        section.update({ descriptionMode: "aria" });

        expect(section.element.getAttribute("aria-describedby"))
            .toBe(section.description.id);

        section.setActions(null);

        expect(section.actions.hidden).toBe(true);

        section.destroy();
    });

    it("keeps SettingsGroup aligned with FormSection without duplicating its semantics", () => {
        const settings = SettingsGroup({
            title: "Learning preferences",
            description: "Choose how practice sessions should behave.",
            headingLevel: 4,
            children: "Preference controls."
        });

        document.body.append(settings.element);

        expect(settings.element.localName).toBe("section");
        expect(settings.element.getAttribute("data-af-composition"))
            .toBe("settings-group");
        expect(settings.formSection.element).toBe(settings.element);
        expect(settings.heading.localName).toBe("h4");
        expect(settings.element.getAttribute("aria-labelledby"))
            .toBe(settings.heading.id);
        expect(settings.description.hidden).toBe(false);
        expect(settings.element.getAttribute("aria-describedby")).toBeNull();

        settings.update({ descriptionMode: "aria" });

        expect(settings.element.getAttribute("aria-describedby"))
            .toBe(settings.description.id);

        settings.destroy();
    });
});
