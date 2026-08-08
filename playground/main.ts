import { createPage, mount } from "./demo/af";
import { FooterDemo } from "./demo/footer";
import { HeaderDemo } from "./demo/header";
import { NavigationDemo } from "./demo/navigation";
import {
    AccordionDemo,
    AlertDialogDemo,
    ButtonsDemo,
    ChecksDemo,
    ComboboxDemo,
    DialogDemo,
    DisclosureDemo,
    IconButtonsDemo,
    LayoutDemo,
    LinksDemo,
    ListboxDemo,
    MarkupDemo,
    MenuDemo,
    PopoverDemo,
    SelectDemo,
    TabsDemo,
} from "./demo/sections";
import "../packages/components/src/styles/index.css";

/*const shouldResetInitialScroll = !window.location.hash;

if (shouldResetInitialScroll && "scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
}

function resetInitialScrollPosition(): void {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
    window.setTimeout(() => window.scrollTo(0, 0), 50);
}*/

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
page.section(MenuDemo());
page.section(SelectDemo());
page.section(ComboboxDemo());
page.section(PopoverDemo());
page.section(LayoutDemo());
page.section(MarkupDemo());
page.section(ChecksDemo());
page.footer(FooterDemo());

mount(page, "#app");

/*if (shouldResetInitialScroll) {
    resetInitialScrollPosition();
}*/

page.inspect();
