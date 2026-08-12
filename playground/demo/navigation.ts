import {
    ResponsiveNavigation,
    type ComposedNode,
    type NavigationItem
} from "./af";

const playgroundNavigationItems: NavigationItem[] = [
    { label: "Buttons", href: "#buttons" },
    { label: "Checkbox", href: "#checkbox" },
    { label: "RadioGroup", href: "#radio-group" },
    { label: "Switch", href: "#switch" },
    { label: "TextField", href: "#text-field" },
    { label: "FieldGroup", href: "#field-group" },
    { label: "FormSection", href: "#form-section" },
    { label: "Form", href: "#form" },
    { label: "DescriptionList", href: "#description-list" },
    { label: "Breadcrumbs", href: "#breadcrumbs" },
    { label: "ActionsBar", href: "#actions-bar" },
    { label: "Icon buttons", href: "#icon-buttons" },
    { label: "Tooltip", href: "#tooltip" },
    { label: "Toast", href: "#toast" },
    { label: "Links", href: "#links" },
    { label: "Disclosure", href: "#disclosure" },
    { label: "Accordion", href: "#accordion" },
    { label: "Dialog", href: "#dialog" },
    { label: "Alert dialog", href: "#alert-dialog" },
    { label: "Tabs", href: "#tabs" },
    { label: "Listbox", href: "#listbox" },
    { label: "Menu", href: "#menu" },
    { label: "Select", href: "#select" },
    { label: "Combobox", href: "#combobox" },
    { label: "Popover", href: "#popover" },
    { label: "Layout", href: "#layout" },
    { label: "Markup", href: "#markup" },
    { label: "Manual checks", href: "#checks" }
];

export function NavigationDemo(): ComposedNode {
    return ResponsiveNavigation({
        className: "playground-nav__inner",
        trigger: "Sections",
        variant: "pills",
        items: playgroundNavigationItems
    });
}
