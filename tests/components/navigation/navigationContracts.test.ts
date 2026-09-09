import {
    describe,
    expect,
    it,
    vi
} from "vitest";
import { Breadcrumbs } from "../../../packages/components/src/breadcrumbs";
import { Navigation } from "../../../packages/components/src/navigation";
import { Pagination } from "../../../packages/components/src/pagination";

describe("Navigation contracts", () => {
    it("keeps Breadcrumbs as a labelled navigation landmark with hidden separators", () => {
        const breadcrumbs = Breadcrumbs({
            label: "Lesson path",
            separator: ">",
            items: [
                { label: "Home", href: "/" },
                { label: "Lessons", href: "/lessons" },
                { label: "First lesson" }
            ]
        });

        const [home, lessons, current] = breadcrumbs.items;

        if (!home || !lessons || !current) {
            throw new Error("Expected composed breadcrumb items.");
        }

        document.body.append(breadcrumbs.element);

        expect(breadcrumbs.element.localName).toBe("nav");
        expect(breadcrumbs.element.getAttribute("aria-label")).toBe("Lesson path");
        expect(breadcrumbs.list.localName).toBe("ol");
        expect(home.content.localName).toBe("a");
        expect(home.content.getAttribute("href")).toBe("/");
        expect(lessons.content.localName).toBe("a");
        expect(current.content.localName).toBe("span");
        expect(current.content.getAttribute("aria-current")).toBe("page");
        expect(home.separator?.textContent).toBe(">");
        expect(home.separator?.getAttribute("aria-hidden")).toBe("true");

        breadcrumbs.update({
            labelledBy: "lesson-heading",
            separator: "/"
        });

        expect(breadcrumbs.element.getAttribute("aria-label")).toBeNull();
        expect(breadcrumbs.element.getAttribute("aria-labelledby"))
            .toBe("lesson-heading");
        expect(home.separator?.textContent).toBe("/");

        breadcrumbs.destroy();
    });

    it("keeps Navigation as a real link list and updates the current route", () => {
        const onNavigate = vi.fn();
        const navigation = Navigation({
            items: [
                { id: "home", label: "Home", href: "#home" },
                { id: "lessons", label: "Lessons", href: "#lessons" }
            ],
            onNavigate
        });

        const [home, lessons] = navigation.items;

        if (!home || !lessons) {
            throw new Error("Expected composed navigation items.");
        }

        document.body.append(navigation.element);

        expect(navigation.element.localName).toBe("ul");
        expect(navigation.element.getAttribute("role")).toBeNull();
        expect(home.link.element.localName).toBe("a");
        expect(home.link.element.getAttribute("href")).toBe("#home");
        expect(lessons.link.element.getAttribute("aria-current")).toBeNull();

        navigation.setCurrent("#lessons");

        expect(home.link.element.getAttribute("aria-current")).toBeNull();
        expect(lessons.link.element.getAttribute("aria-current")).toBe("page");

        lessons.link.element.dispatchEvent(new MouseEvent("click", {
            bubbles: true,
            cancelable: true
        }));

        expect(onNavigate).toHaveBeenCalledWith(
            expect.objectContaining({
                item: expect.objectContaining({
                    id: "lessons",
                    href: "#lessons"
                }),
                index: 1
            }),
            navigation
        );

        navigation.destroy();
    });

    it("uses buttons for SPA pagination and real links for URL-backed pagination", () => {
        const onPageChange = vi.fn();
        const statefulPagination = Pagination({
            page: 2,
            pageCount: 4,
            label: "Search result pages",
            getPageLabel: ({ page }) => `Go to page ${page}`,
            getCurrentPageLabel: ({ page }) => `Page ${page}, current page`,
            onPageChange
        });

        document.body.append(statefulPagination.element);

        const pageThree = statefulPagination.items.find(
            (item) => item.kind === "page" && item.page === 3
        );
        const currentPage = statefulPagination.items.find(
            (item) => item.kind === "page" && item.page === 2
        );

        if (!pageThree || !currentPage) {
            throw new Error("Expected pagination page items.");
        }

        expect(statefulPagination.element.localName).toBe("nav");
        expect(statefulPagination.element.getAttribute("aria-label"))
            .toBe("Search result pages");
        expect(pageThree.control.localName).toBe("button");
        expect(pageThree.control.getAttribute("aria-label")).toBe("Go to page 3");
        expect(currentPage.control.localName).toBe("span");
        expect(currentPage.control.getAttribute("aria-current")).toBe("page");
        expect(currentPage.control.getAttribute("aria-label"))
            .toBe("Page 2, current page");

        pageThree.control.click();

        expect(onPageChange).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 3,
                previousPage: 2
            }),
            statefulPagination
        );
        expect(statefulPagination.getPage()).toBe(2);

        statefulPagination.setPage(3);

        expect(statefulPagination.getPage()).toBe(3);
        expect(statefulPagination.items.find(
            (item) => item.kind === "page" && item.page === 3
        )?.isCurrent()).toBe(true);

        const linkedPagination = Pagination({
            page: 1,
            pageCount: 20,
            siblingCount: 0,
            boundaryCount: 1,
            ellipsisText: "More pages",
            getHref: ({ page }) => `/lessons?page=${page}`
        });

        document.body.append(linkedPagination.element);

        const previous = linkedPagination.items.find(
            (item) => item.kind === "previous"
        );
        const next = linkedPagination.items.find(
            (item) => item.kind === "next"
        );
        const current = linkedPagination.items.find(
            (item) => item.kind === "page" && item.page === 1
        );
        const lastPage = linkedPagination.items.find(
            (item) => item.kind === "page" && item.page === 20
        );
        const ellipsis = linkedPagination.items.find(
            (item) => item.kind === "ellipsis"
        );

        if (!previous || !next || !current || !lastPage || !ellipsis) {
            throw new Error("Expected linked pagination controls.");
        }

        expect(previous.control.localName).toBe("button");
        expect(previous.isDisabled()).toBe(true);
        expect(current.control.localName).toBe("span");
        expect(current.isCurrent()).toBe(true);
        expect(next.control.localName).toBe("a");
        expect(next.control.getAttribute("href")).toBe("/lessons?page=2");
        expect(lastPage.control.localName).toBe("a");
        expect(lastPage.control.getAttribute("href")).toBe("/lessons?page=20");
        expect(ellipsis.control.localName).toBe("span");
        expect(ellipsis.control.getAttribute("aria-label")).toBe("More pages");
        expect(ellipsis.isDisabled()).toBe(true);

        statefulPagination.destroy();
        linkedPagination.destroy();
    });
});
