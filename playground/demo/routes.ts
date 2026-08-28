import { type ComposedNode } from "./af";
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
    PaginationDemo,
    ProgressDemo,
    RadioGroupDemo,
    ResultSummaryDemo,
    ScreenDemo,
    SelectDemo,
    SettingsGroupDemo,
    SwitchDemo,
    TableDemo,
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

const markupRoute: PlaygroundRoute = {
    id: "markup",
    label: "Markup",
    title: "Markup",
    render: MarkupDemo
};

export const playgroundRoutes: PlaygroundRoute[] = [
    markupRoute,
    { id: "layout", label: "Layout", title: "Layout", render: LayoutDemo },

    { id: "buttons", label: "Buttons", title: "Buttons", render: ButtonsDemo },
    { id: "links", label: "Links", title: "Links", render: LinksDemo },
    { id: "icon-buttons", label: "Icon buttons", title: "Icon buttons", render: IconButtonsDemo },

    { id: "badge", label: "Badge", title: "Badge", render: BadgeDemo },
    { id: "progress", label: "Progress", title: "Progress", render: ProgressDemo },
    { id: "pagination", label: "Pagination", title: "Pagination", render: PaginationDemo },
    { id: "result-summary", label: "ResultSummary", title: "ResultSummary", render: ResultSummaryDemo },
    { id: "description-list", label: "DescriptionList", title: "DescriptionList", render: DescriptionListDemo },
    { id: "table", label: "Table", title: "Table", render: TableDemo },
    { id: "empty-state", label: "EmptyState", title: "EmptyState", render: EmptyStateDemo },
    { id: "info-card", label: "InfoCard", title: "InfoCard", render: InfoCardDemo },

    { id: "actions-bar", label: "ActionsBar", title: "ActionsBar", render: ActionsBarDemo },
    { id: "tooltip", label: "Tooltip", title: "Tooltip", render: TooltipDemo },

    { id: "disclosure", label: "Disclosure", title: "Disclosure", render: DisclosureDemo },
    { id: "accordion", label: "Accordion", title: "Accordion", render: AccordionDemo },
    { id: "popover", label: "Popover", title: "Popover", render: PopoverDemo },
    { id: "dialog", label: "Dialog", title: "Dialog", render: DialogDemo },
    { id: "alert-dialog", label: "Alert dialog", title: "Alert dialog", render: AlertDialogDemo },
    { id: "toast", label: "Toast", title: "Toast", render: ToastDemo },

    { id: "checkbox", label: "Checkbox", title: "Checkbox", render: CheckboxDemo },
    { id: "radio-group", label: "RadioGroup", title: "RadioGroup", render: RadioGroupDemo },
    { id: "switch", label: "Switch", title: "Switch", render: SwitchDemo },
    { id: "text-field", label: "TextField", title: "TextField", render: TextFieldDemo },
    { id: "field-group", label: "FieldGroup", title: "FieldGroup", render: FieldGroupDemo },
    { id: "form-section", label: "FormSection", title: "FormSection", render: FormSectionDemo },
    { id: "form", label: "Form", title: "Form", render: FormDemo },

    { id: "breadcrumbs", label: "Breadcrumbs", title: "Breadcrumbs", render: BreadcrumbsDemo },
    { id: "tabs", label: "Tabs", title: "Tabs", render: TabsDemo },
    { id: "listbox", label: "Listbox", title: "Listbox", render: ListboxDemo },
    { id: "select", label: "Select", title: "Select", render: SelectDemo },
    { id: "combobox", label: "Combobox", title: "Combobox", render: ComboboxDemo },
    { id: "menu", label: "Menu", title: "Menu", render: MenuDemo },

    { id: "settings-group", label: "SettingsGroup", title: "SettingsGroup", render: SettingsGroupDemo },
    { id: "screen", label: "Screen", title: "Screen", render: ScreenDemo },
    { id: "list-detail", label: "ListDetail", title: "ListDetail", render: ListDetailDemo },

    { id: "checks", label: "Manual checks", title: "Manual checks", render: ChecksDemo }
];

export const initialPlaygroundRoute = markupRoute;

function normalizeRouteId(value: string): string {
    return value.replace(/^#/, "").trim();
}

export function getPlaygroundRouteById(id: string | null | undefined): PlaygroundRoute | null {
    if (!id) return null;

    const routeId = normalizeRouteId(id);

    return playgroundRoutes.find((route) => route.id === routeId) ?? null;
}

export function getPlaygroundRouteByHash(hash = window.location.hash): PlaygroundRoute {
    return getPlaygroundRouteById(hash) ?? initialPlaygroundRoute;
}
