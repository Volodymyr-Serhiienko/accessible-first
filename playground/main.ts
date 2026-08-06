import { createPage, mount } from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { HeaderDemo } from "./demo/header";
import { NavigationDemo } from "./demo/navigation";
import {
    AccordionDemo,
    AlertDialogDemo,
    ButtonsDemo,
    ChecksDemo,
    DialogDemo,
    DisclosureDemo,
    IconButtonsDemo,
    LayoutDemo,
    LinksDemo,
    ListboxDemo,
    MarkupDemo,
    TabsDemo,
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
page.section(IconButtonsDemo());
page.section(LinksDemo());
page.section(DisclosureDemo());
page.section(AccordionDemo());
page.section(DialogDemo());
page.section(AlertDialogDemo());
page.section(TabsDemo());
page.section(ListboxDemo());
page.section(LayoutDemo());
page.section(MarkupDemo());
page.section(ChecksDemo());
page.footer(FooterDemo());

mount(page, "#app");
page.inspect();
