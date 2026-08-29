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
    | "commandPalette.trigger"
    | "dialog.alertFallbackLabel"
    | "dialog.closeText"
    | "dialog.fallbackLabel"
    | "headerTools.closeText"
    | "headerTools.description"
    | "headerTools.hint"
    | "headerTools.title"
    | "headerTools.trigger"
    | "iconButton.fallbackLabel"
    | "languageSelect.label"
    | "listDetail.detailLabel"
    | "listDetail.listLabel"
    | "overflowScroller.nextLabel"
    | "overflowScroller.previousLabel"
    | "pagination.currentPage"
    | "pagination.ellipsis"
    | "pagination.label"
    | "pagination.next"
    | "pagination.page"
    | "pagination.previous"
    | "resultSummary.empty"
    | "resultSummary.filtered"
    | "resultSummary.one"
    | "resultSummary.range"
    | "resultSummary.rangeUnknownTotal"
    | "resultSummary.total"
    | "page.navigationLabel"
    | "page.skipLinkText"
    | "responsiveNavigation.close"
    | "responsiveNavigation.trigger"
    | "routeCommandPalette.commandLabelPrefix"
    | "routeSearchBox.label"
    | "routeSearchBox.notFoundText"
    | "routeSearchBox.placeholder"
    | "textField.emailPatternMismatchMessage"
    | "themeToggle.darkAnnouncement"
    | "themeToggle.lightAnnouncement"
    | "themeToggle.switchLabel"
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
    "commandPalette.trigger": "Commands",
    "dialog.alertFallbackLabel": "Alert dialog",
    "dialog.closeText": "Close",
    "dialog.fallbackLabel": "Dialog",
    "headerTools.closeText": "Close panel",
    "headerTools.description": "Search, commands, language, theme, and other header controls.",
    "headerTools.hint": "Header tools",
    "headerTools.title": "Header tools",
    "headerTools.trigger": "Header tools",
    "iconButton.fallbackLabel": "Icon button",
    "languageSelect.label": "Language",
    "listDetail.detailLabel": "Details",
    "listDetail.listLabel": "Items",
    "overflowScroller.nextLabel": "Scroll right",
    "overflowScroller.previousLabel": "Scroll left",
    "pagination.currentPage": "Page {page}, current page",
    "pagination.ellipsis": "More pages",
    "pagination.label": "Pagination",
    "pagination.next": "Next page",
    "pagination.page": "Page {page}",
    "pagination.previous": "Previous page",
    "resultSummary.empty": "No results.",
    "resultSummary.filtered": "{count} of {total} results shown.",
    "resultSummary.one": "1 result.",
    "resultSummary.range": "Showing {start}-{end} of {total} results.",
    "resultSummary.rangeUnknownTotal": "Showing {start}-{end} results.",
    "resultSummary.total": "{total} results.",
    "page.navigationLabel": "Primary",
    "page.skipLinkText": "Skip to content",
    "responsiveNavigation.close": "Close menu",
    "responsiveNavigation.trigger": "Menu",
    "routeCommandPalette.commandLabelPrefix": "Open ",
    "routeSearchBox.label": "Search pages",
    "routeSearchBox.notFoundText": "No matching pages found.",
    "routeSearchBox.placeholder": "Search pages",
    "textField.emailPatternMismatchMessage": "Enter an email address with a domain, such as name@example.com.",
    "themeToggle.darkAnnouncement": "Dark theme enabled.",
    "themeToggle.lightAnnouncement": "Light theme enabled.",
    "themeToggle.switchLabel": "Dark theme",
    "themeToggle.toDarkLabel": "Dark theme",
    "themeToggle.toLightLabel": "Light theme",
    "toast.closeButtonText": "Close",
    "toast.closeLabel": "Dismiss notification",
    "toast.fallbackDescription": "Notification",
    "toast.label": "Notifications"
};
