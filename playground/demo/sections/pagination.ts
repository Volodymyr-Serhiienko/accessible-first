import { Grid, H3, P, Pagination, Panel, Section, Stack, Table, type ComposedNode } from "../af";
import { playgroundLocale } from "../localization";

const demoPageCount = 12;

function getPageStatus(page: number): string {
    return `Showing result page ${page} of ${demoPageCount}.`;
}

export function PaginationDemo(): ComposedNode {
    let currentPage = 6;
    const status = P({ text: getPageStatus(currentPage) });
    const rows = (page: number) => [1, 2].map(index => `Result ${(page - 1) * 2 + index}`);
    const table = Table({ caption: "Demo results", rows: rows(currentPage),
        rowOptions: { attributes: { tabindex: "0" } },
        columns: [{ id: "result", header: "Result", cell: value => value }] });

    const statefulPagination = Pagination({
        page: currentPage,
        pageCount: demoPageCount,
        label: "Demo result pages",
        locale: playgroundLocale,
        focusTarget: () => table.bodyRows[0]?.element ?? table.table,
        onPageChange(detail, pagination) {
            currentPage = detail.page;
            table.setRows(rows(currentPage));
            status.element.textContent = getPageStatus(currentPage);
            pagination.setPage(currentPage);
        }
    });

    return Section({
        id: "pagination",
        title: "Pagination",
        children: [
            P("Pagination keeps long result sets navigable with real page semantics. It can drive SPA state or render native links for MPA pages."),
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Stateful pagination"),
                        P("Use onPageChange when the app updates the visible list without leaving the current page."),
                        status,
                        table,
                        statefulPagination
                    )
                ),
                Panel(
                    Stack(
                        H3("Native-link pagination"),
                        P("Use getHref when each page has a real URL. Current and unavailable targets are not extra tab stops."),
                        Pagination({
                            page: 3,
                            pageCount: 18,
                            siblingCount: 1,
                            boundaryCount: 1,
                            getHref() {
                                return "#pagination";
                            },
                            locale: playgroundLocale
                        })
                    )
                ),
                Panel(
                    Stack(
                        H3("Plain compact pagination"),
                        P("Boundary and sibling counts control how many page numbers stay visible before ellipsis items appear."),
                        Pagination({
                            page: 24,
                            pageCount: 48,
                            siblingCount: 0,
                            boundaryCount: 1,
                            variant: "plain",
                            locale: playgroundLocale
                        })
                    )
                )
            )
        ]
    });
}
