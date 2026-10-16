import { describe, expect, it, vi } from "vitest";
import { Breadcrumbs, type ComposedBreadcrumbs } from "../../../packages/components/src/breadcrumbs";
import { Pagination } from "../../../packages/components/src/pagination";
import { ListDetail } from "../../../packages/components/src/list-detail";
import { createLocaleSubscription } from "../../../packages/components/src/localization/createLocaleSubscription";
import { getLocaleText } from "../../../packages/components/src/localization";
import { ResultSummary } from "../../../packages/components/src/result-summary";

function child(text: string, destroy = vi.fn()) {
    const element = document.createElement("span");
    element.textContent = text;
    return { element, destroy };
}

function localeProbe(fail = false) {
    let listener = () => {};
    const unsubscribe = vi.fn(() => { if (fail) throw new Error("unsubscribe"); });
    const locale = { t: (key: string) => key, subscribe(callback: () => void) { listener = callback; return unsubscribe; } };
    return { locale, unsubscribe, emit: () => listener() };
}

describe("Replaceable locale subscription", () => {
    it("ignores old provider callbacks and unsubscribes each owner once", () => {
        const first = localeProbe();
        const second = localeProbe();
        const changed = vi.fn();
        const subscription = createLocaleSubscription(changed);
        subscription.replace(first.locale);
        first.emit();
        subscription.replace(second.locale);
        first.emit();
        second.emit();
        subscription.destroy();
        second.emit();
        subscription.replace(first.locale);
        subscription.destroy();
        expect(changed).toHaveBeenCalledTimes(2);
        expect(first.unsubscribe).toHaveBeenCalledOnce();
        expect(second.unsubscribe).toHaveBeenCalledOnce();
    });

    it("installs the new provider even when releasing the old one fails", () => {
        const first = localeProbe(true);
        const second = localeProbe();
        const changed = vi.fn();
        const subscription = createLocaleSubscription(changed);
        subscription.replace(first.locale);
        expect(() => subscription.replace(second.locale)).toThrow("unsubscribe");
        first.emit();
        second.emit();
        expect(changed).toHaveBeenCalledOnce();
        subscription.destroy();
        expect(second.unsubscribe).toHaveBeenCalledOnce();
    });

    it("releases a subscription returned after a synchronous callback destroys its owner", () => {
        const unsubscribe = vi.fn();
        const subscription = createLocaleSubscription(() => subscription.destroy());
        subscription.replace({ subscribe(callback) { callback(); return unsubscribe; } });
        expect(unsubscribe).toHaveBeenCalledOnce();
        subscription.destroy();
        expect(unsubscribe).toHaveBeenCalledOnce();
    });

    it("keeps a newer provider installed from an old unsubscribe callback", () => {
        const newer = localeProbe();
        const obsolete = localeProbe();
        const subscribe = vi.spyOn(obsolete.locale, "subscribe");
        const subscription = createLocaleSubscription(vi.fn());
        subscription.replace({ subscribe: () => () => subscription.replace(newer.locale) });
        subscription.replace(obsolete.locale);
        expect(subscribe).not.toHaveBeenCalled();
        subscription.destroy();
        expect(newer.unsubscribe).toHaveBeenCalledOnce();
    });
});

describe("Breadcrumb replacement ownership", () => {
    it("keeps removed item handles and destroyed controllers inert", () => {
        const view = Breadcrumbs({ items: [{ label: "Old", href: "#old" }] });
        const old = view.items[0]!;
        view.setItems([{ label: "New" }]);
        const oldMarkup = old.element.outerHTML;
        old.setLabelContent("late");
        expect(old.element.outerHTML).toBe(oldMarkup);
        view.destroy();
        const markup = view.element.outerHTML;
        view.setLabel("late");
        view.setLabelledBy("late");
        view.setItems([{ label: "late" }]);
        view.update({ separator: ">", attributes: { "data-late": "true" } });
        expect(view.element.outerHTML).toBe(markup);
    });

    it("attempts all labels and finishes replacement after a cleanup failure", () => {
        const bad = child("bad", vi.fn(() => { throw new Error("label cleanup"); }));
        const other = child("other");
        const view = Breadcrumbs({ items: [{ label: other }, { label: bad }] });
        expect(() => view.setItems([{ label: "New" }])).toThrow("label cleanup");
        expect(other.destroy).toHaveBeenCalledOnce();
        expect(view.list.textContent).toBe("New");
        view.destroy();
    });

    it("keeps newer items requested by an old label cleanup", () => {
        let view: ComposedBreadcrumbs;
        const abandoned = child("abandoned");
        const old = child("old", vi.fn(() => view.setItems([{ label: "Newest" }])));
        view = Breadcrumbs({ items: [{ label: old }] });
        view.setItems([{ label: abandoned }]);
        expect(view.list.textContent).toBe("Newest");
        expect(view.items[0]!.getText()).toBe("Newest");
        expect(abandoned.destroy).toHaveBeenCalledOnce();
        view.destroy();
    });

    it("cleans labels even when locale unsubscription throws and ignores stale notifications", () => {
        const locale = localeProbe(true);
        const content = child("content");
        const view = Breadcrumbs({ items: [{ label: content }], locale: locale.locale });
        expect(() => view.destroy()).toThrow("unsubscribe");
        expect(content.destroy).toHaveBeenCalledOnce();
        const markup = view.element.outerHTML;
        locale.emit();
        expect(view.element.outerHTML).toBe(markup);
        expect(() => view.destroy()).not.toThrow();
        expect(locale.unsubscribe).toHaveBeenCalledOnce();
    });

    it("cleans partially created items and the initial locale subscription on build failure", () => {
        const locale = localeProbe();
        const content = child("content");
        expect(() => Breadcrumbs({ locale: locale.locale, items: [{ label: content }, {
            get label(): string { throw new Error("renderer"); }
        }] })).toThrow("renderer");
        expect(content.destroy).toHaveBeenCalledOnce();
        expect(locale.unsubscribe).toHaveBeenCalledOnce();
    });
});

describe("Pagination lifetime and stable updates", () => {
    it("formats native fallback page labels without requiring a locale provider", () => {
        const view = Pagination({ page: 2, pageCount: 5 });
        expect(view.items.find(item => item.kind === "page" && item.page === 3)!.control.getAttribute("aria-label"))
            .toBe("Page 3");
        expect(view.items.find(item => item.isCurrent())!.control.getAttribute("aria-label"))
            .toBe("Page 2, current page");
        view.destroy();
    });

    it("preserves controls and focus for chrome/callback-only updates", () => {
        const first = vi.fn();
        const next = vi.fn();
        const view = Pagination({ page: 2, pageCount: 5, onPageChange: first });
        document.body.append(view.element);
        const control = view.items.find(item => item.kind === "next")!.control;
        control.focus();
        view.update({ variant: "plain", label: "Results", onPageChange: next });
        expect(view.items.find(item => item.kind === "next")!.control).toBe(control);
        expect(document.activeElement).toBe(control);
        control.click();
        expect(first).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledOnce();
        view.destroy();
    });

    it("does not rebuild for unchanged normalized pages/counts", () => {
        const view = Pagination({ page: 2, pageCount: 5 });
        const control = view.items.find(item => item.kind === "next")!.control;
        view.setPage(2.1);
        view.setPageCount(5.1);
        view.update({ page: 2, pageCount: 5 });
        expect(view.items.find(item => item.kind === "next")!.control).toBe(control);
        view.destroy();
    });

    it("ignores all mutations and delayed locale notifications after destroy", () => {
        const locale = localeProbe();
        const view = Pagination({ page: 2, pageCount: 5, locale: locale.locale });
        view.destroy();
        const markup = view.element.outerHTML;
        view.setPage(3);
        view.setPageCount(6);
        view.update({ attributes: { "data-late": "true" }, disabled: false });
        locale.emit();
        expect(view.element.outerHTML).toBe(markup);
        expect(view.getPage()).toBe(2);
        expect(view.getPageCount()).toBe(5);
    });

    it("removes every control listener even if locale unsubscription fails", () => {
        const locale = localeProbe(true);
        const onPageChange = vi.fn();
        const view = Pagination({ page: 2, pageCount: 5, locale: locale.locale, onPageChange });
        const next = view.items.find(item => item.kind === "next")!.control;
        expect(() => view.destroy()).toThrow("unsubscribe");
        next.click();
        expect(onPageChange).not.toHaveBeenCalled();
        expect(view.items).toHaveLength(0);
        expect(() => view.destroy()).not.toThrow();
    });

    it("releases partially built click listeners when a later href resolver fails", () => {
        const add = vi.spyOn(EventTarget.prototype, "addEventListener");
        const onPageChange = vi.fn();
        expect(() => Pagination({ page: 1, pageCount: 5, onPageChange,
            getHref({ page }) { if (page === 3) throw new Error("href"); return `#page-${page}`; }
        })).toThrow("href");
        const controls = add.mock.instances.filter((target, index) => add.mock.calls[index]?.[0] === "click"
            && target instanceof HTMLElement && target.hasAttribute("data-af-pagination-control"));
        expect(controls.length).toBeGreaterThan(0);
        for (const control of controls) (control as HTMLElement).click();
        expect(onPageChange).not.toHaveBeenCalled();
    });

    it("does not overwrite a newer page selected from a resolver", () => {
        const view = Pagination({ page: 1, pageCount: 5 });
        let replaced = false;
        view.update({ getHref({ page }) {
            if (!replaced) { replaced = true; view.setPage(4); }
            return `#page-${page}`;
        } });
        expect(view.getPage()).toBe(4);
        expect(view.items.filter(item => item.isCurrent()).map(item => item.page)).toEqual([4]);
        expect(view.list.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
        view.destroy();
    });

    it("releases the locale subscription if initial label resolution fails", () => {
        const locale = localeProbe();
        expect(() => Pagination({ page: 1, pageCount: 5, locale: locale.locale,
            getPageLabel() { throw new Error("label"); }
        })).toThrow("label");
        expect(locale.unsubscribe).toHaveBeenCalledOnce();
    });
});

describe("Parameterized localization fallback", () => {
    it("uses the shared formatter for falsy values and leaves missing parameters intact", () => {
        expect(getLocaleText(null, "test", "{count}/{enabled}/{missing}", { count: 0, enabled: false }))
            .toBe("0/false/{missing}");
    });

    it("does not reinterpret a provider's already resolved literal text", () => {
        expect(getLocaleText({ t: () => "Literal {page}" }, "test", "Page {page}", { page: 3 }))
            .toBe("Literal {page}");
    });

    it("also formats default result summaries without a locale provider", () => {
        const summary = ResultSummary({ total: 27, start: 1, end: 20 });
        expect(summary.element.textContent).not.toContain("{");
        expect(summary.element.textContent).toContain("27");
        summary.destroy();
    });
});

describe("ListDetail slot lifetime", () => {
    it("ignores late setters/update/focus after destruction", () => {
        const view = ListDetail({ list: "List", detail: "Detail" });
        document.body.append(view.element);
        view.destroy();
        const markup = view.element.outerHTML;
        view.setList("late");
        view.setDetail("late");
        view.setEmpty("late");
        view.update({ attributes: { "data-late": "true" }, listWidth: "25rem" });
        expect(view.focus("detail")).toBe(false);
        expect(view.element.outerHTML).toBe(markup);
    });

    it("releases every slot and restores focus attributes despite a failed unsubscribe", () => {
        const locale = localeProbe(true);
        const list = child("list");
        const detail = child("detail");
        const empty = child("empty");
        const view = ListDetail({ list, detail, empty, locale: locale.locale });
        expect(() => view.destroy()).toThrow("unsubscribe");
        expect(list.destroy).toHaveBeenCalledOnce();
        expect(detail.destroy).toHaveBeenCalledOnce();
        expect(empty.destroy).toHaveBeenCalledOnce();
        expect(view.list.hasAttribute("tabindex")).toBe(false);
        expect(view.detail.hasAttribute("tabindex")).toBe(false);
        expect(() => view.destroy()).not.toThrow();
    });

    it("finishes visibility synchronization when removed detail cleanup fails", () => {
        const old = child("old", vi.fn(() => { throw new Error("detail cleanup"); }));
        const view = ListDetail({ list: "List", detail: old, empty: "Nothing selected" });
        expect(() => view.setDetail(null)).toThrow("detail cleanup");
        expect(view.detailContent.hidden).toBe(true);
        expect(view.empty.hidden).toBe(false);
        view.destroy();
    });

    it("does not overwrite a newer detail set by list cleanup in a combined update", () => {
        const old = child("old", vi.fn(() => view.setDetail("Newest")));
        const view = ListDetail({ list: old, detail: "Initial" });
        view.update({ list: "New list", detail: "Obsolete detail" });
        expect(view.detailContent.textContent).toBe("Newest");
        expect(view.detailContent.hidden).toBe(false);
        view.destroy();
    });

    it("does not continue another slot update after cleanup destroys the view", () => {
        const old = child("old", vi.fn(() => view.destroy()));
        const detail = child("detail");
        const view = ListDetail({ list: old, detail });
        view.update({ list: "new", detail: "late", orientation: "vertical" });
        expect(view.detailContent.textContent).not.toBe("late");
        expect(detail.destroy).toHaveBeenCalledOnce();
    });

    it("attempts all slot cleanups even when list cleanup throws", () => {
        const list = child("list", vi.fn(() => { throw new Error("list cleanup"); }));
        const detail = child("detail");
        const empty = child("empty");
        const view = ListDetail({ list, detail, empty });
        expect(() => view.destroy()).toThrow("list cleanup");
        expect(detail.destroy).toHaveBeenCalledOnce();
        expect(empty.destroy).toHaveBeenCalledOnce();
        expect(view.list.hasAttribute("tabindex")).toBe(false);
        expect(() => view.destroy()).not.toThrow();
    });

    it("finishes the other requested slots after a cleanup error without an intervening update", () => {
        const list = child("list", vi.fn(() => { throw new Error("list cleanup"); }));
        const view = ListDetail({ list, detail: "Old" });
        expect(() => view.update({ list: "New list", detail: null, empty: "Nothing selected" })).toThrow("list cleanup");
        expect(view.detailContent.hidden).toBe(true);
        expect(view.empty.textContent).toBe("Nothing selected");
        expect(view.empty.hidden).toBe(false);
        view.destroy();
    });

    it("uses explicit focus and falls back to the list when no detail/empty exists", () => {
        const view = ListDetail({ list: "List" });
        document.body.append(view.element);
        expect(view.focus("detail")).toBe(true);
        expect(document.activeElement).toBe(view.list);
        view.setDetail("Detail");
        expect(view.focus("detail")).toBe(true);
        expect(document.activeElement).toBe(view.detail);
        view.destroy();
    });
});
