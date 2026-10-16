import {
    createAppRouteRegistry,
    type ComposedNode
} from "./af";
import { createLazyDemo } from "./lazyDemo";
import { MarkupDemo } from "./sections/markup";

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
    { id: "layout", label: "Layout", title: "Layout", render: createLazyDemo(() => import("./sections/layout").then(module => module.LayoutDemo)) },

    { id: "buttons", label: "Buttons", title: "Buttons", render: createLazyDemo(() => import("./sections/buttons").then(module => module.ButtonsDemo)) },
    { id: "links", label: "Links", title: "Links", render: createLazyDemo(() => import("./sections/links").then(module => module.LinksDemo)) },
    { id: "icon-buttons", label: "Icon buttons", title: "Icon buttons", render: createLazyDemo(() => import("./sections/iconButtons").then(module => module.IconButtonsDemo)) },

    { id: "badge", label: "Badge", title: "Badge", render: createLazyDemo(() => import("./sections/badge").then(module => module.BadgeDemo)) },
    { id: "progress", label: "Progress", title: "Progress", render: createLazyDemo(() => import("./sections/progress").then(module => module.ProgressDemo)) },
    { id: "pagination", label: "Pagination", title: "Pagination", render: createLazyDemo(() => import("./sections/pagination").then(module => module.PaginationDemo)) },
    { id: "result-summary", label: "ResultSummary", title: "ResultSummary", render: createLazyDemo(() => import("./sections/resultSummary").then(module => module.ResultSummaryDemo)) },
    { id: "description-list", label: "DescriptionList", title: "DescriptionList", render: createLazyDemo(() => import("./sections/descriptionList").then(module => module.DescriptionListDemo)) },
    { id: "table", label: "Table", title: "Table", render: createLazyDemo(() => import("./sections/table").then(module => module.TableDemo)) },
    { id: "empty-state", label: "EmptyState", title: "EmptyState", render: createLazyDemo(() => import("./sections/emptyState").then(module => module.EmptyStateDemo)) },
    { id: "info-card", label: "InfoCard", title: "InfoCard", render: createLazyDemo(() => import("./sections/infoCard").then(module => module.InfoCardDemo)) },

    { id: "actions-bar", label: "ActionsBar", title: "ActionsBar", render: createLazyDemo(() => import("./sections/actionsBar").then(module => module.ActionsBarDemo)) },
    { id: "tooltip", label: "Tooltip", title: "Tooltip", render: createLazyDemo(() => import("./sections/tooltip").then(module => module.TooltipDemo)) },

    { id: "disclosure", label: "Disclosure", title: "Disclosure", render: createLazyDemo(() => import("./sections/disclosure").then(module => module.DisclosureDemo)) },
    { id: "accordion", label: "Accordion", title: "Accordion", render: createLazyDemo(() => import("./sections/accordion").then(module => module.AccordionDemo)) },
    { id: "popover", label: "Popover", title: "Popover", render: createLazyDemo(() => import("./sections/popover").then(module => module.PopoverDemo)) },
    { id: "dialog", label: "Dialog", title: "Dialog", render: createLazyDemo(() => import("./sections/dialog").then(module => module.DialogDemo)) },
    { id: "alert-dialog", label: "Alert dialog", title: "Alert dialog", render: createLazyDemo(() => import("./sections/alertDialog").then(module => module.AlertDialogDemo)) },
    { id: "toast", label: "Toast", title: "Toast", render: createLazyDemo(() => import("./sections/toast").then(module => module.ToastDemo)) },

    { id: "checkbox", label: "Checkbox", title: "Checkbox", render: createLazyDemo(() => import("./sections/checkbox").then(module => module.CheckboxDemo)) },
    { id: "radio-group", label: "RadioGroup", title: "RadioGroup", render: createLazyDemo(() => import("./sections/radioGroup").then(module => module.RadioGroupDemo)) },
    { id: "switch", label: "Switch", title: "Switch", render: createLazyDemo(() => import("./sections/switch").then(module => module.SwitchDemo)) },
    { id: "text-field", label: "TextField", title: "TextField", render: createLazyDemo(() => import("./sections/textField").then(module => module.TextFieldDemo)) },
    { id: "field-group", label: "FieldGroup", title: "FieldGroup", render: createLazyDemo(() => import("./sections/fieldGroup").then(module => module.FieldGroupDemo)) },
    { id: "form-section", label: "FormSection", title: "FormSection", render: createLazyDemo(() => import("./sections/formSection").then(module => module.FormSectionDemo)) },
    { id: "form", label: "Form", title: "Form", render: createLazyDemo(() => import("./sections/form").then(module => module.FormDemo)) },

    { id: "breadcrumbs", label: "Breadcrumbs", title: "Breadcrumbs", render: createLazyDemo(() => import("./sections/breadcrumbs").then(module => module.BreadcrumbsDemo)) },
    { id: "tabs", label: "Tabs", title: "Tabs", render: createLazyDemo(() => import("./sections/tabs").then(module => module.TabsDemo)) },
    { id: "listbox", label: "Listbox", title: "Listbox", render: createLazyDemo(() => import("./sections/listbox").then(module => module.ListboxDemo)) },
    { id: "select", label: "Select", title: "Select", render: createLazyDemo(() => import("./sections/select").then(module => module.SelectDemo)) },
    { id: "combobox", label: "Combobox", title: "Combobox", render: createLazyDemo(() => import("./sections/combobox").then(module => module.ComboboxDemo)) },
    { id: "menu", label: "Menu", title: "Menu", render: createLazyDemo(() => import("./sections/menu").then(module => module.MenuDemo)) },

    { id: "settings-group", label: "SettingsGroup", title: "SettingsGroup", render: createLazyDemo(() => import("./sections/settingsGroup").then(module => module.SettingsGroupDemo)) },
    { id: "screen", label: "Screen", title: "Screen", render: createLazyDemo(() => import("./sections/screen").then(module => module.ScreenDemo)) },
    { id: "list-detail", label: "ListDetail", title: "ListDetail", render: createLazyDemo(() => import("./sections/listDetail").then(module => module.ListDetailDemo)) },

    { id: "checks", label: "Manual checks", title: "Manual checks", render: createLazyDemo(() => import("./sections/checks").then(module => module.ChecksDemo)) }
];

const renderMarkup = markupRoute.render;
markupRoute.render = () => {
    const content = renderMarkup();
    content.element.lang = "en";
    return content;
};

/**
 * Route registry shared by playground routing, route text, and app chrome helpers.
 */
export const playgroundRouteRegistry = createAppRouteRegistry({
    routes: playgroundRoutes,
    defaultRoute: markupRoute
});

export const initialPlaygroundRoute = playgroundRouteRegistry.defaultRoute;

export const getPlaygroundRouteById = playgroundRouteRegistry.getById;

export const getPlaygroundRouteByHash = playgroundRouteRegistry.resolveHash;
