import {
    accessibleFirstEnglishMessages,
    createLocaleController,
    type AccessibleFirstMessageKey,
    type LocaleController,
    type LocaleMessageParams,
    type LocaleMessages,
    type LocaleMessagesByLocale
} from "./af";
import { playgroundAppIdentity } from "./appIdentity";

export const playgroundSupportedLocales = ["en", "uk", "ru"] as const;

export type PlaygroundLocale = typeof playgroundSupportedLocales[number];

export type PlaygroundAppMessageKey =
    | "app.breadcrumbs.rootLabel"
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
    | "app.navigation.returnHint"
    | "app.navigation.returnLink"
    | "app.navigation.skipLink"
    | "app.navigation.trigger"
    | "app.notifications.label"
    | "app.route.commandDescription"
    | "app.route.loaded"
    | "app.route.outletLabel"
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
    "app.brand.name": playgroundAppIdentity.name,
    "app.brand.tagline": "WCAG-first components and page composition",
    "app.breadcrumbs.rootLabel": "Playground",
    "app.commands.description": "Search demo sections and press Enter to open the selected section.",
    "app.commands.notFoundText": "No commands found.",
    "app.commands.placeholder": "Search commands",
    "app.commands.searchLabel": "Search playground commands",
    "app.commands.title": "Playground commands",
    "app.commands.trigger": "Commands",
    "app.navigation.label": "Playground sections",
    "app.navigation.returnHint": "Moves focus back to the current section navigation item.",
    "app.navigation.returnLink": "Back to section navigation",
    "app.navigation.skipLink": "Skip to section navigation",
    "app.navigation.trigger": "Sections",
    "app.notifications.label": "Playground notifications",
    "app.route.commandDescription": "Open the {title} demo section.",
    "app.route.loaded": "{title} demo loaded.",
    "app.route.outletLabel": "Playground demo content",
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
    "headerTools.closeText": "Закрити панель",
    "headerTools.description": "Пошук, команди, мова, тема та інші елементи керування заголовка.",
    "headerTools.hint": "Інструменти заголовка",
    "headerTools.title": "Інструменти заголовка",
    "headerTools.trigger": "Інструменти заголовка",
    "iconButton.fallbackLabel": "Кнопка з іконкою",
    "languageSelect.label": "Мова",
    "listDetail.detailLabel": "Деталі",
    "listDetail.listLabel": "Елементи",
    "overflowScroller.nextLabel": "Прокрутити праворуч",
    "overflowScroller.previousLabel": "Прокрутити ліворуч",
    "pagination.currentPage": "Сторінка {page}, поточна сторінка",
    "pagination.ellipsis": "Більше сторінок",
    "pagination.label": "Пагінація",
    "pagination.next": "Наступна сторінка",
    "pagination.page": "Сторінка {page}",
    "pagination.previous": "Попередня сторінка",
    "resultSummary.empty": "Результатів немає.",
    "resultSummary.filtered": "Показано {count} з {total} результатів.",
    "resultSummary.one": "1 результат.",
    "resultSummary.range": "Показано {start}-{end} з {total} результатів.",
    "resultSummary.rangeUnknownTotal": "Показано {start}-{end} результатів.",
    "resultSummary.total": "{total} результатів.",
    "page.navigationLabel": "Основна навігація",
    "page.skipLinkText": "Перейти до вмісту",
    "responsiveNavigation.close": "Закрити меню",
    "responsiveNavigation.trigger": "Меню",
    "routeCommandPalette.commandLabelPrefix": "Відкрити ",
    "textField.emailPatternMismatchMessage": "Введіть адресу електронної пошти з доменом, наприклад name@example.com.",
    "themeToggle.darkAnnouncement": "Темну тему ввімкнено.",
    "themeToggle.lightAnnouncement": "Світлу тему ввімкнено.",
    "themeToggle.switchLabel": "Темна тема",
    "themeToggle.toDarkLabel": "Темна тема",
    "themeToggle.toLightLabel": "Світла тема",
    "toast.closeButtonText": "Закрити",
    "toast.closeLabel": "Закрити сповіщення",
    "toast.fallbackDescription": "Сповіщення",
    "toast.label": "Сповіщення",
    "app.brand.homeLabel": "Головна сторінка Accessible First Playground",
    "app.brand.name": playgroundAppIdentity.name,
    "app.brand.tagline": "WCAG-first компоненти та семантична композиція сторінок",
    "app.breadcrumbs.rootLabel": "Playground",
    "app.commands.description": "Знайдіть деморозділ і натисніть Enter, щоб відкрити його.",
    "app.commands.notFoundText": "Команди не знайдено.",
    "app.commands.placeholder": "Пошук команд",
    "app.commands.searchLabel": "Пошук команд playground",
    "app.commands.title": "Команди playground",
    "app.commands.trigger": "Команди",
    "app.navigation.label": "Розділи playground",
    "app.navigation.returnHint": "Переміщує фокус назад на поточний пункт навігації розділів.",
    "app.navigation.returnLink": "Повернутися до навігації розділів",
    "app.navigation.skipLink": "Перейти до навігації розділів",
    "app.navigation.trigger": "Розділи",
    "app.notifications.label": "Сповіщення playground",
    "app.route.commandDescription": "Відкрити деморозділ {title}.",
    "app.route.loaded": "Деморозділ {title} завантажено.",
    "app.route.outletLabel": "Вміст деморозділу playground",
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
    "headerTools.closeText": "Закрыть панель",
    "headerTools.description": "Поиск, команды, язык, тема и другие элементы управления заголовка.",
    "headerTools.hint": "Инструменты заголовка",
    "headerTools.title": "Инструменты заголовка",
    "headerTools.trigger": "Инструменты заголовка",
    "iconButton.fallbackLabel": "Кнопка с иконкой",
    "languageSelect.label": "Язык",
    "listDetail.detailLabel": "Детали",
    "listDetail.listLabel": "Элементы",
    "overflowScroller.nextLabel": "Прокрутить вправо",
    "overflowScroller.previousLabel": "Прокрутить влево",
    "pagination.currentPage": "Страница {page}, текущая страница",
    "pagination.ellipsis": "Больше страниц",
    "pagination.label": "Пагинация",
    "pagination.next": "Следующая страница",
    "pagination.page": "Страница {page}",
    "pagination.previous": "Предыдущая страница",
    "resultSummary.empty": "Результатов нет.",
    "resultSummary.filtered": "Показано {count} из {total} результатов.",
    "resultSummary.one": "1 результат.",
    "resultSummary.range": "Показано {start}-{end} из {total} результатов.",
    "resultSummary.rangeUnknownTotal": "Показано {start}-{end} результатов.",
    "resultSummary.total": "{total} результатов.",
    "page.navigationLabel": "Основная навигация",
    "page.skipLinkText": "Перейти к содержимому",
    "responsiveNavigation.close": "Закрыть меню",
    "responsiveNavigation.trigger": "Меню",
    "routeCommandPalette.commandLabelPrefix": "Открыть ",
    "textField.emailPatternMismatchMessage": "Введите адрес электронной почты с доменом, например name@example.com.",
    "themeToggle.darkAnnouncement": "Темная тема включена.",
    "themeToggle.lightAnnouncement": "Светлая тема включена.",
    "themeToggle.switchLabel": "Темная тема",
    "themeToggle.toDarkLabel": "Темная тема",
    "themeToggle.toLightLabel": "Светлая тема",
    "toast.closeButtonText": "Закрыть",
    "toast.closeLabel": "Закрыть уведомление",
    "toast.fallbackDescription": "Уведомление",
    "toast.label": "Уведомления",
    "app.brand.homeLabel": "Главная страница Accessible First Playground",
    "app.brand.name": playgroundAppIdentity.name,
    "app.brand.tagline": "WCAG-first компоненты и семантическая композиция страниц",
    "app.breadcrumbs.rootLabel": "Playground",
    "app.commands.description": "Найдите демо-раздел и нажмите Enter, чтобы открыть его.",
    "app.commands.notFoundText": "Команды не найдены.",
    "app.commands.placeholder": "Поиск команд",
    "app.commands.searchLabel": "Поиск команд playground",
    "app.commands.title": "Команды playground",
    "app.commands.trigger": "Команды",
    "app.navigation.label": "Разделы playground",
    "app.navigation.returnHint": "Перемещает фокус обратно на текущий пункт навигации разделов.",
    "app.navigation.returnLink": "Вернуться к навигации разделов",
    "app.navigation.skipLink": "Перейти к навигации разделов",
    "app.navigation.trigger": "Разделы",
    "app.notifications.label": "Уведомления playground",
    "app.route.commandDescription": "Открыть демо-раздел {title}.",
    "app.route.loaded": "Демо-раздел {title} загружен.",
    "app.route.outletLabel": "Содержимое демо-раздела playground",
    "app.route.searchDescription": "Открыть раздел {title}.",
    "app.search.label": "Поиск демо-разделов",
    "app.search.notFoundText": "Подходящие разделы не найдены.",
    "app.search.placeholder": "Поиск разделов"
} satisfies LocaleMessages<PlaygroundMessageKey>;

export const playgroundMessages = {
    en: enMessages,
    uk: ukMessages,
    ru: ruMessages
} satisfies LocaleMessagesByLocale<PlaygroundMessageKey>;

export const playgroundRequiredMessageKeys = Array.from(new Set([
    ...Object.keys(accessibleFirstEnglishMessages),
    ...Object.keys(enMessages)
])) as PlaygroundMessageKey[];

export const playgroundLocale: PlaygroundLocaleController = createLocaleController<
    PlaygroundLocale,
    PlaygroundMessageKey
>({
    supportedLocales: playgroundSupportedLocales,
    fallbackLocale: "en",
    storageKey: "af.playground.locale",
    messages: playgroundMessages
});

export function t(key: PlaygroundMessageKey, params?: LocaleMessageParams): string {
    return playgroundLocale.t(key, params);
}
