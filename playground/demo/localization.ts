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
    | "app.route.description"
    | "app.route.loaded"
    | "app.route.outletLabel"
    | "app.route.searchDescription"
    | "app.search.label"
    | "app.search.notFoundText"
    | "app.search.placeholder";

export type PlaygroundRouteMessageKey = `routes.${string}.title`;

export type PlaygroundMessageKey =
    | AccessibleFirstMessageKey
    | PlaygroundAppMessageKey
    | PlaygroundRouteMessageKey;

export type PlaygroundLocaleController =
    LocaleController<PlaygroundLocale, PlaygroundMessageKey>;

const enRouteMessages = {
    "routes.markup.title": "Markup",
    "routes.layout.title": "Layout",
    "routes.buttons.title": "Buttons",
    "routes.links.title": "Links",
    "routes.icon-buttons.title": "Icon buttons",
    "routes.badge.title": "Badge",
    "routes.progress.title": "Progress",
    "routes.pagination.title": "Pagination",
    "routes.result-summary.title": "ResultSummary",
    "routes.description-list.title": "DescriptionList",
    "routes.table.title": "Table",
    "routes.empty-state.title": "EmptyState",
    "routes.info-card.title": "InfoCard",
    "routes.actions-bar.title": "ActionsBar",
    "routes.tooltip.title": "Tooltip",
    "routes.disclosure.title": "Disclosure",
    "routes.accordion.title": "Accordion",
    "routes.popover.title": "Popover",
    "routes.dialog.title": "Dialog",
    "routes.alert-dialog.title": "Alert dialog",
    "routes.toast.title": "Toast",
    "routes.checkbox.title": "Checkbox",
    "routes.radio-group.title": "RadioGroup",
    "routes.switch.title": "Switch",
    "routes.text-field.title": "TextField",
    "routes.field-group.title": "FieldGroup",
    "routes.form-section.title": "FormSection",
    "routes.form.title": "Form",
    "routes.breadcrumbs.title": "Breadcrumbs",
    "routes.tabs.title": "Tabs",
    "routes.listbox.title": "Listbox",
    "routes.select.title": "Select",
    "routes.combobox.title": "Combobox",
    "routes.menu.title": "Menu",
    "routes.settings-group.title": "SettingsGroup",
    "routes.screen.title": "Screen",
    "routes.list-detail.title": "ListDetail",
    "routes.checks.title": "Manual checks"
} satisfies LocaleMessages<PlaygroundRouteMessageKey>;

const ukRouteMessages = {
    "routes.markup.title": "Розмітка",
    "routes.layout.title": "Макет",
    "routes.buttons.title": "Кнопки",
    "routes.links.title": "Посилання",
    "routes.icon-buttons.title": "Кнопки з іконками",
    "routes.badge.title": "Позначка",
    "routes.progress.title": "Прогрес",
    "routes.pagination.title": "Пагінація",
    "routes.result-summary.title": "Підсумок результатів",
    "routes.description-list.title": "Список описів",
    "routes.table.title": "Таблиця",
    "routes.empty-state.title": "Порожній стан",
    "routes.info-card.title": "Інформаційна картка",
    "routes.actions-bar.title": "Панель дій",
    "routes.tooltip.title": "Підказка",
    "routes.disclosure.title": "Розкривний блок",
    "routes.accordion.title": "Акордеон",
    "routes.popover.title": "Спливна панель",
    "routes.dialog.title": "Діалог",
    "routes.alert-dialog.title": "Важливий діалог",
    "routes.toast.title": "Сповіщення",
    "routes.checkbox.title": "Прапорець",
    "routes.radio-group.title": "Група перемикачів",
    "routes.switch.title": "Перемикач",
    "routes.text-field.title": "Текстове поле",
    "routes.field-group.title": "Група полів",
    "routes.form-section.title": "Секція форми",
    "routes.form.title": "Форма",
    "routes.breadcrumbs.title": "Навігаційний ланцюжок",
    "routes.tabs.title": "Вкладки",
    "routes.listbox.title": "Список вибору",
    "routes.select.title": "Вибір",
    "routes.combobox.title": "Комбінований список",
    "routes.menu.title": "Меню",
    "routes.settings-group.title": "Група налаштувань",
    "routes.screen.title": "Екран",
    "routes.list-detail.title": "Список і деталі",
    "routes.checks.title": "Ручні перевірки"
} satisfies LocaleMessages<PlaygroundRouteMessageKey>;

const ruRouteMessages = {
    "routes.markup.title": "Разметка",
    "routes.layout.title": "Макет",
    "routes.buttons.title": "Кнопки",
    "routes.links.title": "Ссылки",
    "routes.icon-buttons.title": "Кнопки с иконками",
    "routes.badge.title": "Метка",
    "routes.progress.title": "Прогресс",
    "routes.pagination.title": "Пагинация",
    "routes.result-summary.title": "Сводка результатов",
    "routes.description-list.title": "Список описаний",
    "routes.table.title": "Таблица",
    "routes.empty-state.title": "Пустое состояние",
    "routes.info-card.title": "Информационная карточка",
    "routes.actions-bar.title": "Панель действий",
    "routes.tooltip.title": "Подсказка",
    "routes.disclosure.title": "Раскрываемый блок",
    "routes.accordion.title": "Аккордеон",
    "routes.popover.title": "Всплывающая панель",
    "routes.dialog.title": "Диалог",
    "routes.alert-dialog.title": "Важный диалог",
    "routes.toast.title": "Уведомления",
    "routes.checkbox.title": "Флажок",
    "routes.radio-group.title": "Группа переключателей",
    "routes.switch.title": "Переключатель",
    "routes.text-field.title": "Текстовое поле",
    "routes.field-group.title": "Группа полей",
    "routes.form-section.title": "Секция формы",
    "routes.form.title": "Форма",
    "routes.breadcrumbs.title": "Навигационная цепочка",
    "routes.tabs.title": "Вкладки",
    "routes.listbox.title": "Список выбора",
    "routes.select.title": "Выбор",
    "routes.combobox.title": "Комбинированный список",
    "routes.menu.title": "Меню",
    "routes.settings-group.title": "Группа настроек",
    "routes.screen.title": "Экран",
    "routes.list-detail.title": "Список и детали",
    "routes.checks.title": "Ручные проверки"
} satisfies LocaleMessages<PlaygroundRouteMessageKey>;
const enMessages = {
    ...enRouteMessages,
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
    "app.route.description": "{title} demo in the {appName}.",
    "app.route.loaded": "{title} demo loaded.",
    "app.route.outletLabel": "Playground demo content",
    "app.route.searchDescription": "Open the {title} section.",
    "app.search.label": "Search demo sections",
    "app.search.notFoundText": "No matching sections found.",
    "app.search.placeholder": "Search sections"
} satisfies LocaleMessages<PlaygroundMessageKey>;

const ukMessages = {
    ...ukRouteMessages,
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
    "app.route.description": "Деморозділ {title} у {appName}.",
    "app.route.loaded": "Деморозділ {title} завантажено.",
    "app.route.outletLabel": "Вміст деморозділу playground",
    "app.route.searchDescription": "Відкрити розділ {title}.",
    "app.search.label": "Пошук деморозділів",
    "app.search.notFoundText": "Відповідних розділів не знайдено.",
    "app.search.placeholder": "Пошук розділів"
} satisfies LocaleMessages<PlaygroundMessageKey>;

const ruMessages = {
    ...ruRouteMessages,
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
    "app.route.description": "Демо-раздел {title} в {appName}.",
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
