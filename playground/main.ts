import { createPage, mount } from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { HeaderDemo } from "./demo/header";
import { NavigationDemo } from "./demo/navigation";
import { notifications } from "./demo/status";
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
} from "./demo/sections";
import "../packages/components/src/styles/index.css";

const page = createPage({
    title: "Accessible First Playground",
    mainId: "main",
    navigationLabel: "Playground sections",
    theme: "system"
});

page.element.classList.add("playground-shell");
page.main.classList.add("playground-main");

page.header(HeaderDemo());
page.navigation(NavigationDemo());

page.section(ButtonsDemo());
page.section(CheckboxDemo());
page.section(RadioGroupDemo());
page.section(SwitchDemo());
page.section(TextFieldDemo());
page.section(FieldGroupDemo());
page.section(FormSectionDemo());
page.section(FormDemo());
page.section(DescriptionListDemo());
page.section(BreadcrumbsDemo());
page.section(ActionsBarDemo());
page.section(IconButtonsDemo());
page.section(TooltipDemo());
page.section(ToastDemo());
page.section(LinksDemo());
page.section(DisclosureDemo());
page.section(AccordionDemo());
page.section(DialogDemo());
page.section(AlertDialogDemo());
page.section(TabsDemo());
page.section(ListboxDemo());
page.section(MenuDemo());
page.section(SelectDemo());
page.section(ComboboxDemo());
page.section(PopoverDemo());
page.section(LayoutDemo());
page.section(MarkupDemo());
page.section(ChecksDemo());

page.appendToMain(notifications);
page.footer(FooterDemo());

mount(page, "#app");
page.inspect();
