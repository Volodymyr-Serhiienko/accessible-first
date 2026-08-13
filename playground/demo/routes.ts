import type { ComposedNode, NavigationItem } from "./af";
import {
    AccordionDemo,
    ActionsBarDemo,
    AlertDialogDemo,
    BreadcrumbsDemo,
    ButtonsDemo,
    CheckboxDemo,
    ChecksDemo,
    ComboboxDemo,
    DescriptionListDemo,
    DialogDemo,
    DisclosureDemo,
    FieldGroupDemo,
    FormDemo,
    FormSectionDemo,
    IconButtonsDemo,
    LayoutDemo,
    LinksDemo,
    ListboxDemo,
    MarkupDemo,
    MenuDemo,
    PopoverDemo,
    RadioGroupDemo,
    SelectDemo,
    SwitchDemo,
    TabsDemo,
    TextFieldDemo,
    ToastDemo,
    TooltipDemo
} from "./sections";

export interface PlaygroundRoute {
    id: string;
    label: string;
    title: string;
    render(): ComposedNode;
}

const buttonsRoute: PlaygroundRoute = {
    id: "buttons",
    label: "Buttons",
    title: "Buttons",
    render: ButtonsDemo
};

export const playgroundRoutes: PlaygroundRoute[] = [
    buttonsRoute,
    { id: "checkbox", label: "Checkbox", title: "Checkbox", render: CheckboxDemo },
    { id: "radio-group", label: "RadioGroup", title: "RadioGroup", render: RadioGroupDemo },
    { id: "switch", label: "Switch", title: "Switch", render: SwitchDemo },
    { id: "text-field", label: "TextField", title: "TextField", render: TextFieldDemo },
    { id: "field-group", label: "FieldGroup", title: "FieldGroup", render: FieldGroupDemo },
    { id: "form-section", label: "FormSection", title: "FormSection", render: FormSectionDemo },
    { id: "form", label: "Form", title: "Form", render: FormDemo },
    { id: "description-list", label: "DescriptionList", title: "DescriptionList", render: DescriptionListDemo },
    { id: "breadcrumbs", label: "Breadcrumbs", title: "Breadcrumbs", render: BreadcrumbsDemo },
    { id: "actions-bar", label: "ActionsBar", title: "ActionsBar", render: ActionsBarDemo },
    { id: "icon-buttons", label: "Icon buttons", title: "Icon buttons", render: IconButtonsDemo },
    { id: "tooltip", label: "Tooltip", title: "Tooltip", render: TooltipDemo },
    { id: "toast", label: "Toast", title: "Toast", render: ToastDemo },
    { id: "links", label: "Links", title: "Links", render: LinksDemo },
    { id: "disclosure", label: "Disclosure", title: "Disclosure", render: DisclosureDemo },
    { id: "accordion", label: "Accordion", title: "Accordion", render: AccordionDemo },
    { id: "dialog", label: "Dialog", title: "Dialog", render: DialogDemo },
    { id: "alert-dialog", label: "Alert dialog", title: "Alert dialog", render: AlertDialogDemo },
    { id: "tabs", label: "Tabs", title: "Tabs", render: TabsDemo },
    { id: "listbox", label: "Listbox", title: "Listbox", render: ListboxDemo },
    { id: "menu", label: "Menu", title: "Menu", render: MenuDemo },
    { id: "select", label: "Select", title: "Select", render: SelectDemo },
    { id: "combobox", label: "Combobox", title: "Combobox", render: ComboboxDemo },
    { id: "popover", label: "Popover", title: "Popover", render: PopoverDemo },
    { id: "layout", label: "Layout", title: "Layout", render: LayoutDemo },
    { id: "markup", label: "Markup", title: "Markup", render: MarkupDemo },
    { id: "checks", label: "Manual checks", title: "Manual checks", render: ChecksDemo }
];

export const initialPlaygroundRoute = buttonsRoute;

export const playgroundNavigationItems: NavigationItem[] = playgroundRoutes.map((route) => ({
    id: route.id,
    label: route.label,
    href: getPlaygroundRouteHref(route)
}));

function normalizeRouteId(value: string): string {
    return value.replace(/^#/, "").trim();
}

export function getPlaygroundRouteHref(route: PlaygroundRoute): string {
    return `#${route.id}`;
}

export function getPlaygroundRouteDocumentTitle(route: PlaygroundRoute): string {
    return `${route.title} - Accessible First Playground`;
}

export function getPlaygroundRouteById(id: string | null | undefined): PlaygroundRoute | null {
    if (!id) return null;

    const routeId = normalizeRouteId(id);

    return playgroundRoutes.find((route) => route.id === routeId) ?? null;
}

export function getPlaygroundRouteByHash(hash = window.location.hash): PlaygroundRoute {
    return getPlaygroundRouteById(hash) ?? initialPlaygroundRoute;
}
