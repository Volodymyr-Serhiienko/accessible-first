import { createId } from "../../../core/src/id";
import { type BaseCompositionOptions, type ComposedNode, type CompositionContent } from "../composition";
import { type ButtonCompositionOptions, type ComposedButton } from "../button";
import { Menu, type ComposedMenu, type MenuCompositionItem, type MenuCompositionSelectDetail } from "../menu";
import { Popover, type PopoverCompositionOptions } from "../popover";

/** Options for a button that opens a command or context-switching menu. */
export interface DropdownMenuOptions extends BaseCompositionOptions {
    trigger: CompositionContent;
    items: MenuCompositionItem[];
    value?: string | null;
    disabled?: boolean;
    triggerOptions?: Omit<ButtonCompositionOptions, "children" | "text" | "onPress" | "disabled">;
    position?: Pick<PopoverCompositionOptions, "side" | "alignment" | "strategy" | "offset" | "collisionPadding" | "flip" | "shift" | "matchAnchorWidth">;
    onSelect?: (detail: MenuCompositionSelectDetail, dropdown: ComposedDropdownMenu) => void;
}

/** A dropdown whose highlighted item is independent of the committed context. */
export interface ComposedDropdownMenu extends ComposedNode<HTMLElement> {
    readonly trigger: HTMLButtonElement;
    readonly triggerButton: ComposedButton;
    readonly menu: ComposedMenu;
    open(): void;
    close(): void;
    isOpen(): boolean;
    getValue(): string | null;
    setValue(value: string | null): void;
    setItems(items: MenuCompositionItem[]): void;
    setDisabled(disabled: boolean): void;
    destroy(): void;
}

/** Composes Menu and Popover with explicit activation and standard keyboard dismissal. */
export function DropdownMenu(options: DropdownMenuOptions): ComposedDropdownMenu {
    let value = options.value ?? null;
    let destroyed = false;
    let composed!: ComposedDropdownMenu;
    let openingEdge: "first" | "last" | null = null;
    const triggerId = options.triggerOptions?.id ?? createId("af-dropdown-trigger");

    function createMenu(items: MenuCompositionItem[]): ComposedMenu {
        return Menu({
            id: createId("af-dropdown-menu"),
            attributes: { "aria-labelledby": triggerId },
            items,
            variant: "plain",
            announceOnHover: false,
            closeOnSelect: false,
            onClose: () => popover.close(),
            onSelect: detail => {
                popover.close();
                options.onSelect?.(detail, composed);
            }
        });
    }

    let menu = createMenu(options.items);
    function syncCurrent(): void {
        for (const item of menu.items) {
            if (item.value === value) item.item.setAttribute("aria-current", "true");
            else item.item.removeAttribute("aria-current");
        }
        if (value !== null) menu.setCurrentValue(value);
    }
    function syncControls(): void {
        popover.trigger.setAttribute("aria-controls", menu.element.id);
    }
    const popover = Popover({
        ...options,
        ...options.position,
        role: null,
        hasPopup: "menu",
        announcement: false,
        restoreFocus: true,
        dismissOnFocusOutside: true,
        children: [menu],
        onOpenChange: detail => {
            syncControls();
            if (!detail.open) return;
            const enabled = menu.items.filter(item => !item.isDisabled());
            const target = openingEdge === "last" ? enabled[enabled.length - 1]
                : openingEdge === "first" ? enabled[0]
                : enabled.find(item => item.value === value) ?? enabled[0];
            openingEdge = null;
            if (target) menu.setCurrentValue(target.value, { focus: true });
        }
    });
    popover.element.setAttribute("data-af-dropdown-menu", "");
    popover.triggerButton.update({ ...options.triggerOptions, id: triggerId });
    popover.trigger.setAttribute("data-af-dropdown-trigger", "");

    function handleTriggerKey(event: KeyboardEvent): void {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        openingEdge = event.key === "ArrowUp" ? "last" : "first";
        if (popover.isOpen()) {
            const enabled = menu.items.filter(item => !item.isDisabled());
            const target = openingEdge === "last" ? enabled[enabled.length - 1] : enabled[0];
            openingEdge = null;
            if (target) menu.setCurrentValue(target.value, { focus: true });
        } else popover.open();
    }
    function handleMenuKey(event: KeyboardEvent): void {
        // Closing restores the trigger before the browser's native Tab traversal.
        if (event.key === "Tab") popover.close();
    }
    popover.trigger.addEventListener("keydown", handleTriggerKey);
    popover.content.addEventListener("keydown", handleMenuKey);
    syncCurrent();
    syncControls();

    composed = {
        element: popover.element,
        trigger: popover.trigger,
        triggerButton: popover.triggerButton,
        get menu() { return menu; },
        open: popover.open,
        close: popover.close,
        isOpen: popover.isOpen,
        getValue: () => value,
        setValue(next): void { value = next; syncCurrent(); },
        setItems(items): void {
            popover.close();
            menu = createMenu(items);
            popover.setContent(menu);
            syncCurrent();
            syncControls();
        },
        setDisabled(disabled): void {
            popover.setDisabled(disabled);
            popover.triggerButton.setDisabled(disabled);
            syncControls();
        },
        destroy(): void {
            if (destroyed) return;
            destroyed = true;
            popover.trigger.removeEventListener("keydown", handleTriggerKey);
            popover.content.removeEventListener("keydown", handleMenuKey);
            popover.destroy();
        }
    };
    composed.setDisabled(options.disabled ?? false);
    return composed;
}
