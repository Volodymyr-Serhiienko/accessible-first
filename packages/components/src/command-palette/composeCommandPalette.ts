import type { BaseCompositionOptions } from "../composition";
import {
    Dialog,
    type ComposedDialog,
    type DialogCompositionContent,
    type DialogCompositionOptions,
    type DialogCompositionUpdateOptions
} from "../dialog";
import { addEventListener, type Cleanup } from "../../../core/src/events";
import { isEscapeKey } from "../../../core/src/keyboard";
import {
    SearchBox,
    type ComposedSearchBox,
    type SearchBoxItem,
    type SearchBoxOptions,
    type SearchBoxSelectDetail,
    type SearchBoxUpdateOptions
} from "../search-box";

const DEFAULT_TITLE = "Command palette";
const DEFAULT_DESCRIPTION = "Search commands and press Enter to run the selected result.";
const DEFAULT_SEARCH_LABEL = "Search commands";
const DEFAULT_PLACEHOLDER = "Search commands";
const DEFAULT_NOT_FOUND_TEXT = "No commands found.";

/**
 * Keyboard shortcut configuration for opening CommandPalette.
 */
export interface CommandPaletteShortcutOptions {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    preventDefault?: boolean;
    allowInEditable?: boolean;
}

/**
 * Keyboard shortcut or shortcut list accepted by CommandPalette().
 */
export type CommandPaletteShortcut =
    | CommandPaletteShortcutOptions
    | readonly CommandPaletteShortcutOptions[]
    | false
    | null;

/**
 * Minimal command palette controller passed to item-level run callbacks.
 */
export interface CommandPaletteRuntime {
    open(): void;
    close(): void;
    toggle(): void;
    setOpen(open: boolean): void;
    isOpen(): boolean;
}

/**
 * Called by an individual command item when it is selected.
 */
export type CommandPaletteItemRun = (
    detail: CommandPaletteSelectDetail,
    palette: CommandPaletteRuntime
) => void;

/**
 * One command accepted by CommandPalette().
 */
export interface CommandPaletteItem<TData = unknown> extends SearchBoxItem<TData> {
    run?: CommandPaletteItemRun | null;
    closeOnSelect?: boolean;
}

/**
 * Details passed when a command is selected.
 */
export interface CommandPaletteSelectDetail<
    TItem extends CommandPaletteItem = CommandPaletteItem
> extends SearchBoxSelectDetail<TItem> {
    command: TItem;
}

/**
 * Called when a command is selected.
 */
export type CommandPaletteOnSelect<
    TItem extends CommandPaletteItem = CommandPaletteItem
> = (
    detail: CommandPaletteSelectDetail<TItem>,
    palette: ComposedCommandPalette<TItem>
) => void;

/**
 * Called when the command palette opens or closes.
 */
export type CommandPaletteOnOpenChange<
    TItem extends CommandPaletteItem = CommandPaletteItem
> = (
    open: boolean,
    palette: ComposedCommandPalette<TItem>
) => void;

/**
 * SearchBox options owned by CommandPalette().
 */
export type CommandPaletteSearchBoxOptions<
    TItem extends CommandPaletteItem = CommandPaletteItem
> = Omit<SearchBoxOptions<TItem>, "items" | "onSelect">;

/**
 * SearchBox update options accepted by ComposedCommandPalette.update().
 */
export type CommandPaletteSearchBoxUpdateOptions<
    TItem extends CommandPaletteItem = CommandPaletteItem
> = Omit<SearchBoxUpdateOptions<TItem>, "items" | "onSelect">;

/**
 * Dialog options owned by CommandPalette().
 */
export type CommandPaletteDialogOptions = Omit<
    DialogCompositionOptions,
    "trigger" | "title" | "description" | "children" | "actions" | "initialFocus" | "initialFocusTarget" | "onOpenChange"
>;

/**
 * Options for CommandPalette().
 */
export interface CommandPaletteOptions<
    TItem extends CommandPaletteItem = CommandPaletteItem
> extends BaseCompositionOptions {
    trigger: DialogCompositionContent;
    items: TItem[];
    title?: string;
    description?: string | null;
    searchLabel?: string | null;
    placeholder?: string | null;
    notFoundText?: string | null;
    closeOnSelect?: boolean;
    searchBoxOptions?: CommandPaletteSearchBoxOptions<TItem>;
    dialogOptions?: CommandPaletteDialogOptions;
    shortcut?: CommandPaletteShortcut;
    onSelect?: CommandPaletteOnSelect<TItem> | null;
    onOpenChange?: CommandPaletteOnOpenChange<TItem> | null;
}

/**
 * Options accepted by ComposedCommandPalette.update().
 */
export interface CommandPaletteUpdateOptions<
    TItem extends CommandPaletteItem = CommandPaletteItem
> extends Partial<Omit<CommandPaletteOptions<TItem>, "items" | "searchBoxOptions" | "dialogOptions">> {
    items?: TItem[];
    searchBoxOptions?: CommandPaletteSearchBoxUpdateOptions<TItem>;
    dialogOptions?: DialogCompositionUpdateOptions;
}

/**
 * Command palette created by the composition API.
 */
export interface ComposedCommandPalette<
    TItem extends CommandPaletteItem = CommandPaletteItem
> extends Omit<ComposedDialog, "setContent" | "update" | "destroy"> {
    readonly searchBox: ComposedSearchBox<TItem>;
    getItems(): readonly TItem[];
    setItems(items: TItem[]): void;
    update(options: CommandPaletteUpdateOptions<TItem>): void;
    destroy(): void;
}

function getDescription(value: string | null | undefined): string | null {
    return value === undefined ? DEFAULT_DESCRIPTION : value;
}

function isShortcutList(
    shortcut: CommandPaletteShortcutOptions | readonly CommandPaletteShortcutOptions[]
): shortcut is readonly CommandPaletteShortcutOptions[] {
    return Array.isArray(shortcut);
}

function normalizeShortcuts(
    shortcut: CommandPaletteShortcut | undefined
): CommandPaletteShortcutOptions[] {
    if (!shortcut) return [];

    return isShortcutList(shortcut) ? [...shortcut] : [shortcut];
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    const tagName = target.tagName.toLowerCase();

    return target.isContentEditable
        || tagName === "input"
        || tagName === "textarea"
        || tagName === "select";
}

function isShortcutMatch(
    event: KeyboardEvent,
    shortcut: CommandPaletteShortcutOptions
): boolean {
    const keyMatches = shortcut.key.length === 1
        ? event.key.toLowerCase() === shortcut.key.toLowerCase()
        : event.key === shortcut.key;

    return keyMatches
        && event.ctrlKey === (shortcut.ctrlKey ?? false)
        && event.metaKey === (shortcut.metaKey ?? false)
        && event.altKey === (shortcut.altKey ?? false)
        && event.shiftKey === (shortcut.shiftKey ?? false);
}

/**
 * Creates a modal command palette with searchable command results.
 */
export function CommandPalette<
    TItem extends CommandPaletteItem = CommandPaletteItem
>(options: CommandPaletteOptions<TItem>): ComposedCommandPalette<TItem> {
    const {
        trigger,
        items: initialItems,
        title,
        description,
        searchLabel,
        placeholder,
        notFoundText,
        closeOnSelect: initialCloseOnSelect,
        searchBoxOptions,
        dialogOptions,
        shortcut,
        onSelect: initialOnSelect,
        onOpenChange: initialOnOpenChange,
        ...compositionOptions
    } = options;

    let composed!: ComposedCommandPalette<TItem>;
    let items = [...initialItems];
    let closeOnSelect = initialCloseOnSelect ?? true;
    let onSelect = initialOnSelect ?? null;
    let onOpenChange = initialOnOpenChange ?? null;
    let shortcuts = normalizeShortcuts(shortcut);
    let cleanupShortcut: Cleanup | null = null;

    function handleShortcutKeyDown(event: KeyboardEvent): void {
        const matchedShortcut = shortcuts.find((item) => {
            if (!item.allowInEditable && isEditableShortcutTarget(event.target)) {
                return false;
            }

            return isShortcutMatch(event, item);
        });

        if (!matchedShortcut) return;

        if (matchedShortcut.preventDefault ?? true) {
            event.preventDefault();
        }

        if (composed.isOpen()) {
            composed.searchBox.input.focus();
             return;
        }

        composed.open();
    }

    function setupShortcut(): void {
        cleanupShortcut?.();
        cleanupShortcut = null;

        if (shortcuts.length === 0) return;

        cleanupShortcut = addEventListener<KeyboardEvent>(
            dialog.element.ownerDocument,
            "keydown",
            handleShortcutKeyDown
        );
    }

    const handleSelect = (
        detail: SearchBoxSelectDetail<TItem>
    ): void => {
        const commandDetail: CommandPaletteSelectDetail<TItem> = {
            ...detail,
            command: detail.item
        };

        const shouldClose = (detail.item.closeOnSelect ?? closeOnSelect) !== false;

        if (shouldClose) {
            composed.close();
        }

        detail.item.run?.(commandDetail, composed);
        onSelect?.(commandDetail, composed);
    };

    const searchBox = SearchBox<TItem>({
        ...(searchBoxOptions ?? {}),
        items,
        label: searchLabel ?? DEFAULT_SEARCH_LABEL,
        placeholder: placeholder ?? DEFAULT_PLACEHOLDER,
        notFoundText: notFoundText ?? DEFAULT_NOT_FOUND_TEXT,
        openOnFocus: searchBoxOptions?.openOnFocus ?? true,
        onSelect: handleSelect
    });

    const handleOpenChange = (open: boolean): void => {
        onOpenChange?.(open, composed);
    };

    const dialog = Dialog({
        ...compositionOptions,
        ...(dialogOptions ?? {}),
        trigger,
        title: title ?? DEFAULT_TITLE,
        description: getDescription(description),
        children: [searchBox.element],
        initialFocus: searchBox.input,
        onOpenChange: handleOpenChange
    });

    let closeOnEscape = dialogOptions?.closeOnEscape ?? true;
    let cleanupEscapeKey: Cleanup | null = null;

    function handlePaletteEscapeKeyDown(event: KeyboardEvent): void {
        if (!closeOnEscape || !composed.isOpen() || !isEscapeKey(event)) return;
        if (!dialog.dialogElement.contains(event.target as Node | null)) return;

        event.preventDefault();
        event.stopPropagation();
        composed.close();
    }

    function setupEscapeKey(): void {
        cleanupEscapeKey?.();

        cleanupEscapeKey = addEventListener<KeyboardEvent>(
            dialog.dialogElement,
            "keydown",
            handlePaletteEscapeKeyDown,
            { capture: true }
        );
    }

    function setAttributes(): void {
        dialog.element.setAttribute("data-af-command-palette", "");
        dialog.dialogElement.setAttribute("data-af-command-palette-dialog", "");
        searchBox.element.setAttribute("data-af-command-palette-search", "");
    }

    function setItems(nextItems: TItem[]): void {
        items = [...nextItems];
        searchBox.setItems(items);
        setAttributes();
    }

    composed = Object.assign(dialog, {
        searchBox,

        getItems(): readonly TItem[] {
            return items;
        },

        setItems,

        update(nextOptions: CommandPaletteUpdateOptions<TItem>): void {
            if (nextOptions.items !== undefined) {
                setItems(nextOptions.items);
            }

            if (nextOptions.dialogOptions?.closeOnEscape !== undefined) {
                closeOnEscape = nextOptions.dialogOptions.closeOnEscape;
            }

            if ("closeOnSelect" in nextOptions) {
                closeOnSelect = nextOptions.closeOnSelect ?? true;
            }

            if ("onSelect" in nextOptions) {
                onSelect = nextOptions.onSelect ?? null;
            }

            if ("onOpenChange" in nextOptions) {
                onOpenChange = nextOptions.onOpenChange ?? null;
            }

            if ("shortcut" in nextOptions) {
                shortcuts = normalizeShortcuts(nextOptions.shortcut);
                setupShortcut();
            }

            const searchUpdate: SearchBoxUpdateOptions<TItem> = {
                ...(nextOptions.searchBoxOptions ?? {}),
                onSelect: handleSelect
            };

            if ("searchLabel" in nextOptions) searchUpdate.label = nextOptions.searchLabel ?? null;
            if ("placeholder" in nextOptions) searchUpdate.placeholder = nextOptions.placeholder ?? null;
            if ("notFoundText" in nextOptions) searchUpdate.notFoundText = nextOptions.notFoundText ?? null;

            searchBox.update(searchUpdate);

            const dialogUpdate: DialogCompositionUpdateOptions = {
                ...(nextOptions.dialogOptions ?? {}),
                onOpenChange: handleOpenChange
            };

            if (nextOptions.trigger !== undefined) dialogUpdate.trigger = nextOptions.trigger;
            if (nextOptions.title !== undefined) dialogUpdate.title = nextOptions.title;
            if ("description" in nextOptions) dialogUpdate.description = getDescription(nextOptions.description);

            dialog.update(dialogUpdate);
            setAttributes();
        },

        destroy(): void {
            cleanupEscapeKey?.();
            cleanupShortcut?.();
            searchBox.destroy();
            dialog.destroy();
        }
    }) as ComposedCommandPalette<TItem>;

    setAttributes();
    setupShortcut();
    setupEscapeKey();

    return composed;
}
