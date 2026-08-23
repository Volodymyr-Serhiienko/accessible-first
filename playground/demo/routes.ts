import {
    createAppRouteDocumentMetadata,
    createAppRouteNavigationItems,
    type AppRouteDocumentMetadataOptions,
    type ComposedNode,
    type DocumentMetadataUpdateOptions
} from "./af";
import {
    AccordionDemo,
    ActionsBarDemo,
    AlertDialogDemo,
    BadgeDemo,
    BreadcrumbsDemo,
    ButtonsDemo,
    CheckboxDemo,
    ChecksDemo,
    ComboboxDemo,
    DescriptionListDemo,
    DialogDemo,
    DisclosureDemo,
    EmptyStateDemo,
    FieldGroupDemo,
    FormDemo,
    FormSectionDemo,
    IconButtonsDemo,
    InfoCardDemo,
    LayoutDemo,
    LinksDemo,
    ListboxDemo,
    ListDetailDemo,
    MarkupDemo,
    MenuDemo,
    PopoverDemo,
    ProgressDemo,
    RadioGroupDemo,
    ScreenDemo,
    SelectDemo,
    SettingsGroupDemo,
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
    description?: string | null;
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
    { id: "links", label: "Links", title: "Links", render: LinksDemo },
    { id: "icon-buttons", label: "Icon buttons", title: "Icon buttons", render: IconButtonsDemo },
    { id: "badge", label: "Badge", title: "Badge", render: BadgeDemo },
    { id: "progress", label: "Progress", title: "Progress", render: ProgressDemo },
    { id: "description-list", label: "DescriptionList", title: "DescriptionList", render: DescriptionListDemo },
    { id: "empty-state", label: "EmptyState", title: "EmptyState", render: EmptyStateDemo },
    { id: "info-card", label: "InfoCard", title: "InfoCard", render: InfoCardDemo },
    { id: "actions-bar", label: "ActionsBar", title: "ActionsBar", render: ActionsBarDemo },
    { id: "breadcrumbs", label: "Breadcrumbs", title: "Breadcrumbs", render: BreadcrumbsDemo },
    { id: "checkbox", label: "Checkbox", title: "Checkbox", render: CheckboxDemo },
    { id: "radio-group", label: "RadioGroup", title: "RadioGroup", render: RadioGroupDemo },
    { id: "switch", label: "Switch", title: "Switch", render: SwitchDemo },
    { id: "text-field", label: "TextField", title: "TextField", render: TextFieldDemo },
    { id: "field-group", label: "FieldGroup", title: "FieldGroup", render: FieldGroupDemo },
    { id: "form-section", label: "FormSection", title: "FormSection", render: FormSectionDemo },
    { id: "form", label: "Form", title: "Form", render: FormDemo },
    { id: "settings-group", label: "SettingsGroup", title: "SettingsGroup", render: SettingsGroupDemo },
    { id: "screen", label: "Screen", title: "Screen", render: ScreenDemo },
    { id: "tooltip", label: "Tooltip", title: "Tooltip", render: TooltipDemo },
    { id: "toast", label: "Toast", title: "Toast", render: ToastDemo },
    { id: "disclosure", label: "Disclosure", title: "Disclosure", render: DisclosureDemo },
    { id: "accordion", label: "Accordion", title: "Accordion", render: AccordionDemo },
    { id: "dialog", label: "Dialog", title: "Dialog", render: DialogDemo },
    { id: "alert-dialog", label: "Alert dialog", title: "Alert dialog", render: AlertDialogDemo },
    { id: "tabs", label: "Tabs", title: "Tabs", render: TabsDemo },
    { id: "listbox", label: "Listbox", title: "Listbox", render: ListboxDemo },
    { id: "list-detail", label: "ListDetail", title: "ListDetail", render: ListDetailDemo },
    { id: "menu", label: "Menu", title: "Menu", render: MenuDemo },
    { id: "select", label: "Select", title: "Select", render: SelectDemo },
    { id: "combobox", label: "Combobox", title: "Combobox", render: ComboboxDemo },
    { id: "popover", label: "Popover", title: "Popover", render: PopoverDemo },
    { id: "layout", label: "Layout", title: "Layout", render: LayoutDemo },
    { id: "markup", label: "Markup", title: "Markup", render: MarkupDemo },
    { id: "checks", label: "Manual checks", title: "Manual checks", render: ChecksDemo }
];

export const initialPlaygroundRoute = buttonsRoute;

export const playgroundNavigationItems = createAppRouteNavigationItems(playgroundRoutes);

function normalizeRouteId(value: string): string {
    return value.replace(/^#/, "").trim();
}

export function getPlaygroundRouteDocumentTitle(route: PlaygroundRoute): string {
    return getPlaygroundRouteDocumentMetadata(route).title
        ?? `${route.title} - Accessible First Playground`;
}

export function getPlaygroundRouteById(id: string | null | undefined): PlaygroundRoute | null {
    if (!id) return null;

    const routeId = normalizeRouteId(id);

    return playgroundRoutes.find((route) => route.id === routeId) ?? null;
}

export function getPlaygroundRouteByHash(hash = window.location.hash): PlaygroundRoute {
    return getPlaygroundRouteById(hash) ?? initialPlaygroundRoute;
}

export function getPlaygroundRouteDescription(route: PlaygroundRoute): string {
    return route.description
        ?? `${route.title} demo in the Accessible First Playground.`;
}

const playgroundRouteMetadataOptions: AppRouteDocumentMetadataOptions<PlaygroundRoute> = {
    appTitle: "Accessible First Playground",
    baseUrl: new URL(".", window.location.href),
    getDescription: getPlaygroundRouteDescription,
    getStructuredData(route) {
        const description = getPlaygroundRouteDescription(route);

        return {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${route.title} - Accessible First Playground`,
            description,
            url: new URL(`#${route.id}`, window.location.href).toString(),
            isPartOf: {
                "@type": "WebSite",
                name: "Accessible First Playground",
                url: new URL(".", window.location.href).toString()
            }
        };
    }
};

export function getPlaygroundRouteDocumentMetadata(
    route: PlaygroundRoute
): DocumentMetadataUpdateOptions {
    return createAppRouteDocumentMetadata(route, playgroundRouteMetadataOptions);
}
