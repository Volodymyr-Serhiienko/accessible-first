import {
    Badge,
    Button,
    Grid,
    H3,
    P,
    Panel,
    Section,
    Stack,
    Table,
    type BadgeVariant,
    type ComposedNode,
    type TableColumn
} from "../af";
import { announce } from "../status";

interface VocabularyReviewRow {
    id: string;
    word: string;
    translation: string;
    due: string;
    status: string;
    statusVariant: BadgeVariant;
}

const reviewRows: VocabularyReviewRow[] = [
    {
        id: "hello",
        word: "hello",
        translation: "привіт",
        due: "Today",
        status: "Ready",
        statusVariant: "success"
    },
    {
        id: "window",
        word: "window",
        translation: "вікно",
        due: "Tomorrow",
        status: "Learning",
        statusVariant: "info"
    },
    {
        id: "because",
        word: "because",
        translation: "тому що",
        due: "Needs review",
        status: "Attention",
        statusVariant: "warning"
    }
];

function getReviewColumns(): TableColumn<VocabularyReviewRow>[] {
    return [
        {
            id: "word",
            header: "Word",
            rowHeader: true
        },
        {
            id: "translation",
            header: "Translation"
        },
        {
            id: "due",
            header: "Due"
        },
        {
            id: "status",
            header: "Status",
            cell(row) {
                return Badge({
                    text: row.status,
                    variant: row.statusVariant
                });
            }
        },
        {
            id: "action",
            header: "Action",
            cell(row) {
                return Button({
                    text: `Practice ${row.word}`,
                    variant: "secondary",
                    onPress() {
                        announce(`Practice ${row.word} pressed.`);
                    }
                });
            }
        }
    ];
}

export function TableDemo(): ComposedNode {
    return Section({
        id: "table",
        title: "Table",
        children: [
            P("Table keeps real native table semantics for structured data, while adding caption, description, empty-state, and responsive scrolling defaults."),
            Table<VocabularyReviewRow>({
                caption: "Vocabulary review queue",
                description: "Use row headers for the primary item in each row. Buttons and other focusable controls remain reachable inside cells.",
                columns: getReviewColumns(),
                rows: reviewRows,
                getRowKey(row) {
                    return row.id;
                },
                variant: "striped"
            }),
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Object row fallback"),
                        P("When a column has no cell renderer, object rows can render values by matching the column id."),
                        Table({
                            caption: "Small account facts",
                            captionDisplay: "visually-hidden",
                            responsive: "none",
                            columns: [
                                { id: "field", header: "Field", rowHeader: true },
                                { id: "value", header: "Value" }
                            ],
                            rows: [
                                { field: "Locale", value: "System" },
                                { field: "Theme", value: "Dark" }
                            ]
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Empty state"),
                        P("The framework does not invent empty text. Applications provide the message they want users to see and hear."),
                        Table({
                            caption: "Filtered vocabulary results",
                            columns: [
                                { id: "word", header: "Word", rowHeader: true },
                                { id: "translation", header: "Translation" }
                            ],
                            rows: [],
                            emptyState: "No vocabulary items match the current filter."
                        })
                    )
                )
            )
        ]
    });
}
