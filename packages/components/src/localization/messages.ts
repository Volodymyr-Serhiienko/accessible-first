/**
 * Built-in user-facing service text keys owned by Accessible First.
 */
export type AccessibleFirstMessageKey =
    | "alertDialog.cancelText"
    | "alertDialog.confirmText"
    | "breadcrumbs.label"
    | "commandPalette.description"
    | "commandPalette.notFoundText"
    | "commandPalette.placeholder"
    | "commandPalette.searchLabel"
    | "commandPalette.title"
    | "dialog.alertFallbackLabel"
    | "dialog.closeText"
    | "dialog.fallbackLabel"
    | "iconButton.fallbackLabel"
    | "listDetail.detailLabel"
    | "listDetail.listLabel"
    | "overflowScroller.nextLabel"
    | "overflowScroller.previousLabel"
    | "page.navigationLabel"
    | "page.skipLinkText"
    | "responsiveNavigation.trigger"
    | "routeCommandPalette.commandLabelPrefix"
    | "textField.emailPatternMismatchMessage"
    | "themeToggle.darkAnnouncement"
    | "themeToggle.lightAnnouncement"
    | "themeToggle.toDarkLabel"
    | "themeToggle.toLightLabel"
    | "toast.closeButtonText"
    | "toast.closeLabel"
    | "toast.fallbackDescription"
    | "toast.label";

/**
 * English fallback messages for Accessible First service text.
 */
export const accessibleFirstEnglishMessages: Record<AccessibleFirstMessageKey, string> = {
    "alertDialog.cancelText": "Cancel",
    "alertDialog.confirmText": "Confirm",
    "breadcrumbs.label": "Breadcrumb",
    "commandPalette.description": "Search commands and press Enter to run the selected result.",
    "commandPalette.notFoundText": "No commands found.",
    "commandPalette.placeholder": "Search commands",
    "commandPalette.searchLabel": "Search commands",
    "commandPalette.title": "Command palette",
    "dialog.alertFallbackLabel": "Alert dialog",
    "dialog.closeText": "Close",
    "dialog.fallbackLabel": "Dialog",
    "iconButton.fallbackLabel": "Icon button",
    "listDetail.detailLabel": "Details",
    "listDetail.listLabel": "Items",
    "overflowScroller.nextLabel": "Scroll right",
    "overflowScroller.previousLabel": "Scroll left",
    "page.navigationLabel": "Primary",
    "page.skipLinkText": "Skip to content",
    "responsiveNavigation.trigger": "Menu",
    "routeCommandPalette.commandLabelPrefix": "Open ",
    "textField.emailPatternMismatchMessage": "Enter an email address with a domain, such as name@example.com.",
    "themeToggle.darkAnnouncement": "Dark theme enabled.",
    "themeToggle.lightAnnouncement": "Light theme enabled.",
    "themeToggle.toDarkLabel": "Dark theme",
    "themeToggle.toLightLabel": "Light theme",
    "toast.closeButtonText": "Close",
    "toast.closeLabel": "Dismiss notification",
    "toast.fallbackDescription": "Notification",
    "toast.label": "Notifications"
};