import {
    Button,
    Grid,
    H3,
    P,
    Pagination,
    Panel,
    ResultSummary,
    Section,
    Stack,
    type ComposedNode
} from "../af";
import { playgroundLocale } from "../localization";

const totalResults = 87;
const pageSize = 10;
const pageCount = Math.ceil(totalResults / pageSize);

function getCountText(count: number): string {
    return count === 1 ? "1 matching lesson" : `${count} matching lessons`;
}

export function ResultSummaryDemo(): ComposedNode {
    let page = 3;
    let filteredCount = 7;

    const pageSummary = ResultSummary({
        page,
        pageSize,
        total: totalResults,
        live: "polite",
        locale: playgroundLocale
    });

    const pagination = Pagination({
        page,
        pageCount,
        label: "Result summary pages",
        locale: playgroundLocale,
        onPageChange(detail, paginationInstance) {
            page = detail.page;
            paginationInstance.setPage(page);
            pageSummary.update({ page });
        }
    });

    const filteredSummary = ResultSummary({
        count: filteredCount,
        total: 42,
        live: "polite",
        locale: playgroundLocale
    });

    const toggleFilteredCount = Button({
        text: "Toggle filtered count",
        onPress() {
            filteredCount = filteredCount === 7 ? 3 : 7;
            filteredSummary.update({ count: filteredCount });
        }
    });

    return Section({
        id: "result-summary",
        title: "ResultSummary",
        children: [
            P("ResultSummary explains how many items are visible without making every list, search, or table component own that wording."),
            Grid(
                { minColumnWidth: "18rem" },
                Panel(
                    Stack(
                        H3("Paged results"),
                        P("The summary can derive a visible range from page, pageSize, and total."),
                        pageSummary,
                        pagination
                    )
                ),
                Panel(
                    Stack(
                        H3("Filtered count"),
                        P("Use count with total when a search or filter narrows a known result set."),
                        filteredSummary,
                        toggleFilteredCount
                    )
                ),
                Panel(
                    Stack(
                        H3("Custom format"),
                        P("Applications can replace the fallback wording while keeping the same layout and live-region behavior."),
                        ResultSummary({
                            count: filteredCount,
                            total: 42,
                            variant: "strong",
                            format(state) {
                                return state.count === null
                                    ? "No lesson count available."
                                    : getCountText(state.count);
                            }
                        })
                    )
                )
            )
        ]
    });
}
