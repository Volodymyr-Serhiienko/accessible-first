import {
    Badge,
    Button,
    DescriptionList,
    EmptyState,
    InfoCard,
    ListDetail,
    P,
    Section,
    scheduleFocusRoute,
    Stack,
    type ComposedButton,
    type ComposedListDetail,
    type ComposedNode
} from "../af";
import { announce } from "../status";

interface ProjectItem {
    id: string;
    title: string;
    status: string;
    statusVariant: "info" | "success" | "warning";
    owner: string;
    updated: string;
    description: string;
    nextStep: string;
}

const projects: ProjectItem[] = [
    {
        id: "accessibility-audit",
        title: "Accessibility audit",
        status: "In review",
        statusVariant: "warning",
        owner: "Quality team",
        updated: "Today",
        description: "Review keyboard behavior, labels, focus routes, and screen-reader output before release.",
        nextStep: "Resolve remaining focus notes."
    },
    {
        id: "customer-portal",
        title: "Customer portal",
        status: "Ready",
        statusVariant: "success",
        owner: "Product team",
        updated: "Yesterday",
        description: "Prepare a self-service portal with dashboard cards, account settings, and route metadata.",
        nextStep: "Publish preview build."
    },
    {
        id: "content-library",
        title: "Content library",
        status: "Draft",
        statusVariant: "info",
        owner: "Content team",
        updated: "This week",
        description: "Organize searchable documents, categories, and selected item details in one stable screen.",
        nextStep: "Connect real content data."
    }
];

function ProjectDetail(
    project: ProjectItem,
    onReturnToList: () => void
): ComposedNode {
    return Stack(
        InfoCard({
            title: project.title,
            description: project.description,
            meta: Badge({
                text: project.status,
                variant: project.statusVariant
            }),
            children: DescriptionList({
                layout: "inline",
                variant: "plain",
                items: [
                    { term: "Owner", details: project.owner },
                    { term: "Updated", details: project.updated },
                    { term: "Next step", details: project.nextStep }
                ]
            }),
            actions: [
                Button({
                    text: "Open project",
                    variant: "primary",
                    onPress() {
                        announce(`${project.title} opened.`);
                    }
                }),
                Button({
                    text: "Back to project list",
                    variant: "secondary",
                    hint: `Return focus to ${project.title} in the project list.`,
                    onPress: onReturnToList
                })
            ]
        })
    );
}

export function ListDetailDemo(): ComposedNode {
    const buttons: ComposedButton[] = [];
    let listDetail!: ComposedListDetail;

    function focusProjectDetail(): void {
        scheduleFocusRoute({
            target: () => listDetail.getFocusTarget("detail"),
            scroll: true
        });
    }

    function focusProjectButton(projectId: string): void {
        scheduleFocusRoute({
            target: () => buttons.find(
                (item) => item.element.dataset.projectId === projectId
            )?.element,
            fallback: () => listDetail.getFocusTarget("list"),
            scroll: {
                block: "center",
                inline: "nearest",
                behavior: "auto"
            }
        });
    }

    function selectProject(project: ProjectItem): void {
        for (const button of buttons) {
            button.setSelected(button.element.dataset.projectId === project.id);
        }

        listDetail.setDetail(ProjectDetail(project, () => {
            focusProjectButton(project.id);
        }));
        
        focusProjectDetail();
        announce(`${project.title} details shown.`);
    }

    const list = Stack(
        P("Choose a project to show its details. The same pattern can be used for records, lessons, products, messages, settings categories, and search results."),
        ...projects.map((project) => {
            const button = Button({
                text: project.title,
                variant: "secondary",
                hint: `Show details for ${project.title}.`,
                onPress() {
                    selectProject(project);
                }
            });

            button.element.dataset.projectId = project.id;
            buttons.push(button);

            return button;
        })
    );

    listDetail = ListDetail({
        listLabel: "Projects",
        detailLabel: "Project details",
        list,
        empty: EmptyState({
            title: "Choose a project",
            description: "Project details will appear here after selection.",
            align: "start",
            variant: "plain"
        })
    });

    return Section({
        id: "list-detail",
        title: "ListDetail",
        children: [
            P("ListDetail is a domain-neutral app pattern for screens where one area selects an item and another area explains or edits it."),
            listDetail
        ]
    });
}
