import {
    describe,
    expect,
    it
} from "vitest";
import {
    Badge
} from "../../../packages/components/src/badge";
import {
    DescriptionList
} from "../../../packages/components/src/description-list";
import {
    EmptyState
} from "../../../packages/components/src/empty-state";
import {
    InfoCard
} from "../../../packages/components/src/info-card";
import {
    Progress
} from "../../../packages/components/src/progress";
import {
    ResultSummary
} from "../../../packages/components/src/result-summary";
import {
    Table
} from "../../../packages/components/src/table";

function requireElement<TElement extends Element>(
    root: ParentNode,
    selector: string
): TElement {
    const element = root.querySelector<TElement>(selector);

    if (!element) {
        throw new Error(`Expected element matching ${selector}.`);
    }

    return element;
}

describe("content component contracts", () => {
    it("keeps result summaries quiet by default and enables live result updates explicitly", () => {
        const summary = ResultSummary({
            total: 12,
            format(state) {
                return `${state.total ?? 0} matching lessons`;
            }
        });

        document.body.append(summary.element);

        expect(summary.content.textContent).toBe("12 matching lessons");
        expect(summary.element.hasAttribute("aria-live")).toBe(false);
        expect(summary.element.hasAttribute("aria-atomic")).toBe(false);

        summary.update({
            live: "polite",
            atomic: true
        });
        summary.setTotal(4);

        expect(summary.content.textContent).toBe("4 matching lessons");
        expect(summary.element.getAttribute("aria-live")).toBe("polite");
        expect(summary.element.getAttribute("aria-atomic")).toBe("true");

        summary.update({
            live: "off"
        });

        expect(summary.element.hasAttribute("aria-live")).toBe(false);
        expect(summary.element.hasAttribute("aria-atomic")).toBe(false);

        summary.destroy();
    });

    it("uses native headings and deliberate media exposure for empty states, cards, and badges", () => {
        const emptyState = EmptyState({
            media: "Search icon",
            title: "No lessons yet",
            description: "Create a lesson to begin."
        });
        const infoCard = InfoCard({
            media: "Lesson cover",
            meta: "Vocabulary",
            title: "Daily practice",
            description: "Continue your current learning session."
        });
        const badge = Badge({
            text: "12",
            accessibleLabel: "12 lessons",
            variant: "info"
        });

        document.body.append(
            emptyState.element,
            infoCard.element,
            badge.element
        );

        expect(emptyState.title.tagName).toBe("H2");
        expect(emptyState.media.getAttribute("aria-hidden")).toBe("true");
        expect(emptyState.description.hidden).toBe(false);

        expect(infoCard.element.tagName).toBe("ARTICLE");
        expect(infoCard.title.tagName).toBe("H3");
        expect(infoCard.media.hasAttribute("aria-hidden")).toBe(false);
        expect(infoCard.element.hasAttribute("tabindex")).toBe(false);

        expect(badge.content.getAttribute("aria-hidden")).toBe("true");
        expect(badge.accessibleLabel.hidden).toBe(false);
        expect(badge.accessibleLabel.textContent).toBe("12 lessons");

        badge.update({
            accessibleLabel: null
        });

        expect(badge.content.hasAttribute("aria-hidden")).toBe(false);
        expect(badge.accessibleLabel.hidden).toBe(true);

        emptyState.destroy();
        infoCard.destroy();
        badge.destroy();
    });

    it("connects native progress labels and descriptions without announcing every update", () => {
        const progress = Progress({
            label: "Lesson progress",
            value: 4,
            max: 10,
            valueText: "4 of 10 lessons",
            description: "Complete all lesson activities to finish."
        });

        document.body.append(progress.element);

        expect(progress.control.tagName).toBe("PROGRESS");
        expect(progress.label.htmlFor).toBe(progress.control.id);
        expect(progress.control.max).toBe(10);
        expect(progress.control.value).toBe(4);
        expect(progress.control.getAttribute("aria-valuetext"))
            .toBe("4 of 10 lessons");
        expect(progress.control.getAttribute("aria-describedby"))
            .toBe(progress.description.id);
        expect(progress.element.getAttribute("data-af-state"))
            .toBe("determinate");
        expect(progress.element.hasAttribute("aria-live")).toBe(false);

        progress.setValue(null);

        expect(progress.control.hasAttribute("value")).toBe(false);
        expect(progress.element.getAttribute("data-af-state"))
            .toBe("indeterminate");

        progress.destroy();
    });

    it("uses native semantic structures for tables and description lists", () => {
        const table = Table({
            caption: "Vocabulary review queue",
            description: "The first column is the word being reviewed.",
            columns: [
                {
                    id: "word",
                    header: "Word",
                    rowHeader: true
                },
                {
                    id: "translation",
                    header: "Translation"
                }
            ],
            rows: [
                {
                    word: "hello",
                    translation: "привіт"
                }
            ]
        });
        const descriptionList = DescriptionList({
            items: [
                {
                    term: "Status",
                    details: "Ready"
                }
            ]
        });

        document.body.append(table.element, descriptionList.element);

        const columnHeader = requireElement<HTMLTableCellElement>(
            table.table,
            "thead th"
        );
        const rowHeader = requireElement<HTMLTableCellElement>(
            table.table,
            "tbody th"
        );

        expect(table.table.tagName).toBe("TABLE");
        expect(table.caption.textContent).toBe("Vocabulary review queue");
        expect(table.table.getAttribute("aria-describedby"))
            .toBe(table.description.id);
        expect(columnHeader.scope).toBe("col");
        expect(rowHeader.scope).toBe("row");

        expect(descriptionList.element.tagName).toBe("DL");
        expect(requireElement<HTMLElement>(
            descriptionList.element,
            "dt"
        ).textContent).toBe("Status");
        expect(requireElement<HTMLElement>(
            descriptionList.element,
            "dd"
        ).textContent).toBe("Ready");

        table.setRows([]);
        table.setEmptyState("No vocabulary entries.");

        const emptyCell = requireElement<HTMLTableCellElement>(
            table.table,
            "[data-af-table-empty-cell]"
        );

        expect(emptyCell.colSpan).toBe(2);
        expect(emptyCell.textContent).toBe("No vocabulary entries.");

        table.destroy();
        descriptionList.destroy();
    });
});
