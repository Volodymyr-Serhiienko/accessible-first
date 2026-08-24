import {
    createLocaleController,
    type AccessibleFirstMessageKey,
    type LocaleController,
    type LocaleMessageParams,
    type LocaleMessages
} from "./af";

export const playgroundSupportedLocales = ["en", "uk", "ru"] as const;

export type PlaygroundLocale = typeof playgroundSupportedLocales[number];

export type PlaygroundAppMessageKey =
    | "app.brand.homeLabel"
    | "app.brand.name"
    | "app.brand.tagline"
    | "app.commands.description"
    | "app.commands.notFoundText"
    | "app.commands.placeholder"
    | "app.commands.searchLabel"
    | "app.commands.title"
    | "app.commands.trigger"
    | "app.navigation.label"
    | "app.navigation.skipLink"
    | "app.navigation.trigger"
    | "app.notifications.label"
    | "app.route.commandDescription"
    | "app.route.loaded"
    | "app.route.searchDescription"
    | "app.search.label"
    | "app.search.notFoundText"
    | "app.search.placeholder";

export type PlaygroundMessageKey =
    | AccessibleFirstMessageKey
    | PlaygroundAppMessageKey;

export type PlaygroundLocaleController =
    LocaleController<PlaygroundLocale, PlaygroundMessageKey>;

const enMessages = {
    "app.brand.homeLabel": "Accessible First Playground home",
    "app.brand.name": "Accessible First Playground",
    "app.brand.tagline": "WCAG-first components and page composition",
    "app.commands.description": "Search demo sections and press Enter to open the selected section.",
    "app.commands.notFoundText": "No commands found.",
    "app.commands.placeholder": "Search commands",
    "app.commands.searchLabel": "Search playground commands",
    "app.commands.title": "Playground commands",
    "app.commands.trigger": "Commands",
    "app.navigation.label": "Playground sections",
    "app.navigation.skipLink": "Skip to section navigation",
    "app.navigation.trigger": "Sections",
    "app.notifications.label": "Playground notifications",
    "app.route.commandDescription": "Open the {title} demo section.",
    "app.route.loaded": "{title} demo loaded.",
    "app.route.searchDescription": "Open the {title} section.",
    "app.search.label": "Search demo sections",
    "app.search.notFoundText": "No matching sections found.",
    "app.search.placeholder": "Search sections"
} satisfies LocaleMessages<PlaygroundMessageKey>;

const ukMessages = {
    "alertDialog.cancelText": "Скасувати",
    "alertDialog.confirmText": "Підтвердити",
    "breadcrumbs.label": "Навігаційний ланцюжок",
    "commandPalette.description": "Знайдіть команду і натисніть Enter, щоб виконати вибраний результат.",
    "commandPalette.notFoundText": "Команди не знайдено.",
    "commandPalette.placeholder": "Пошук команд",
    "commandPalette.searchLabel": "Пошук команд",
    "commandPalette.title": "Палітра команд",
    "dialog.alertFallbackLabel": "Важливий діалог",
    "dialog.closeText": "Закрити",
    "dialog.fallbackLabel": "Діалог",
    "iconButton.fallbackLabel": "Кнопка з іконкою",
    "listDetail.detailLabel": "Деталі",
    "listDetail.listLabel": "Елементи",
    "overflowScroller.nextLabel": "Прокрутити праворуч",
    "overflowScroller.previousLabel": "Прокрутити ліворуч",
    "page.navigationLabel": "Основна навігація",
    "page.skipLinkText": "Перейти до вмісту",
    "responsiveNavigation.trigger": "Меню",
    "routeCommandPalette.commandLabelPrefix": "Відкрити ",
    "textField.emailPatternMismatchMessage": "Введіть адресу електронної пошти з доменом, наприклад name@example.com.",
    "themeToggle.darkAnnouncement": "Темну тему ввімкнено.",
    "themeToggle.lightAnnouncement": "Світлу тему ввімкнено.",
    "themeToggle.toDarkLabel": "Темна тема",
    "themeToggle.toLightLabel": "Світла тема",
    "toast.closeButtonText": "Закрити",
    "toast.closeLabel": "Закрити сповіщення",
    "toast.fallbackDescription": "Сповіщення",
    "toast.label": "Сповіщення",
    "app.brand.homeLabel": "Головна сторінка Accessible First Playground",
    "app.brand.name": "Accessible First Playground",
    "app.brand.tagline": "WCAG-first компоненти та семантична композиція сторінок",
    "app.commands.description": "Знайдіть деморозділ і натисніть Enter, щоб відкрити його.",
    "app.commands.notFoundText": "Команди не знайдено.",
    "app.commands.placeholder": "Пошук команд",
    "app.commands.searchLabel": "Пошук команд playground",
    "app.commands.title": "Команди playground",
    "app.commands.trigger": "Команди",
    "app.navigation.label": "Розділи playground",
    "app.navigation.skipLink": "Перейти до навігації розділів",
    "app.navigation.trigger": "Розділи",
    "app.notifications.label": "Сповіщення playground",
    "app.route.commandDescription": "Відкрити деморозділ {title}.",
    "app.route.loaded": "Деморозділ {title} завантажено.",
    "app.route.searchDescription": "Відкрити розділ {title}.",
    "app.search.label": "Пошук деморозділів",
    "app.search.notFoundText": "Відповідних розділів не знайдено.",
    "app.search.placeholder": "Пошук розділів"
} satisfies LocaleMessages<PlaygroundMessageKey>;

const ruMessages = {
    "alertDialog.cancelText": "Отмена",
    "alertDialog.confirmText": "Подтвердить",
    "breadcrumbs.label": "Навигационная цепочка",
    "commandPalette.description": "Найдите команду и нажмите Enter, чтобы выполнить выбранный результат.",
    "commandPalette.notFoundText": "Команды не найдены.",
    "commandPalette.placeholder": "Поиск команд",
    "commandPalette.searchLabel": "Поиск команд",
    "commandPalette.title": "Палитра команд",
    "dialog.alertFallbackLabel": "Важный диалог",
    "dialog.closeText": "Закрыть",
    "dialog.fallbackLabel": "Диалог",
    "iconButton.fallbackLabel": "Кнопка с иконкой",
    "listDetail.detailLabel": "Детали",
    "listDetail.listLabel": "Элементы",
    "overflowScroller.nextLabel": "Прокрутить вправо",
    "overflowScroller.previousLabel": "Прокрутить влево",
    "page.navigationLabel": "Основная навигация",
    "page.skipLinkText": "Перейти к содержимому",
    "responsiveNavigation.trigger": "Меню",
    "routeCommandPalette.commandLabelPrefix": "Открыть ",
    "textField.emailPatternMismatchMessage": "Введите адрес электронной почты с доменом, например name@example.com.",
    "themeToggle.darkAnnouncement": "Темная тема включена.",
    "themeToggle.lightAnnouncement": "Светлая тема включена.",
    "themeToggle.toDarkLabel": "Темная тема",
    "themeToggle.toLightLabel": "Светлая тема",
    "toast.closeButtonText": "Закрыть",
    "toast.closeLabel": "Закрыть уведомление",
    "toast.fallbackDescription": "Уведомление",
    "toast.label": "Уведомления",
    "app.brand.homeLabel": "Главная страница Accessible First Playground",
    "app.brand.name": "Accessible First Playground",
    "app.brand.tagline": "WCAG-first компоненты и семантическая композиция страниц",
    "app.commands.description": "Найдите демо-раздел и нажмите Enter, чтобы открыть его.",
    "app.commands.notFoundText": "Команды не найдены.",
    "app.commands.placeholder": "Поиск команд",
    "app.commands.searchLabel": "Поиск команд playground",
    "app.commands.title": "Команды playground",
    "app.commands.trigger": "Команды",
    "app.navigation.label": "Разделы playground",
    "app.navigation.skipLink": "Перейти к навигации разделов",
    "app.navigation.trigger": "Разделы",
    "app.notifications.label": "Уведомления playground",
    "app.route.commandDescription": "Открыть демо-раздел {title}.",
    "app.route.loaded": "Демо-раздел {title} загружен.",
    "app.route.searchDescription": "Открыть раздел {title}.",
    "app.search.label": "Поиск демо-разделов",
    "app.search.notFoundText": "Подходящие разделы не найдены.",
    "app.search.placeholder": "Поиск разделов"
} satisfies LocaleMessages<PlaygroundMessageKey>;

export const playgroundLocale: PlaygroundLocaleController = createLocaleController<
    PlaygroundLocale,
    PlaygroundMessageKey
>({
    supportedLocales: playgroundSupportedLocales,
    fallbackLocale: "en",
    storageKey: "af.playground.locale",
    messages: {
        en: enMessages,
        uk: ukMessages,
        ru: ruMessages
    }
});

export function t(key: PlaygroundMessageKey, params?: LocaleMessageParams): string {
    return playgroundLocale.t(key, params);
}
