import {
    afterEach,
    describe,
    expect,
    it
} from "vitest";
import {
    createAppScreenRoutePattern
} from "../../../packages/components/src/app-routes";
import type {
    AppRouteDescriptor
} from "../../../packages/components/src/app-routes";
import {
    H2
} from "../../../packages/components/src/composition";
import {
    PageOutlet
} from "../../../packages/components/src/page-outlet";
import {
    createHashRouter,
    createHashRouterRoutePattern
} from "../../../packages/components/src/routing";
import {
    RouteBreadcrumbs
} from "../../../packages/components/src/route-breadcrumbs";

afterEach(() => {
    document.body.replaceChildren();
});

function parsePositiveNumber(value: string | undefined): number | null {
    const number = Number(value);

    return Number.isInteger(number) && number > 0 ? number : null;
}

describe("HashRouter route patterns", () => {
    it("keeps exact routes authoritative and resolves canonical parameterized instances", () => {
        const outlet = PageOutlet({ scrollOnRender: false });
        const staticRoute = {
            id: "lessons/7",
            title: "Pinned lesson",
            render: () => H2("Pinned lesson")
        };
        const lessonPattern = createHashRouterRoutePattern({
            id: "lesson",
            pattern: "lessons/:lessonNumber",
            parse(params) {
                const lessonNumber = parsePositiveNumber(params.lessonNumber);

                return lessonNumber === null ? null : { lessonNumber };
            },
            create(params, routeId) {
                return {
                    id: routeId,
                    title: `Lesson ${params.lessonNumber}`,
                    render: () => H2(`Lesson ${params.lessonNumber}`)
                };
            }
        });
        const router = createHashRouter({
            routes: [staticRoute],
            routePatterns: [lessonPattern],
            outlet
        });

        expect(router.getRouteById("lessons/7")).toBe(staticRoute);

        const dynamicRoute = router.getRouteById("#lessons/8");

        expect(dynamicRoute?.id).toBe("lessons/8");
        expect(dynamicRoute?.title).toBe("Lesson 8");
        expect(lessonPattern.getHref({ lessonNumber: 8 })).toBe("#lessons/8");
        expect(router.getRouteHref(dynamicRoute ?? staticRoute)).toBe("#lessons/8");

        expect(router.navigate("#lessons/8", {
            scroll: false,
            announcement: false
        })).toBe(true);
        expect(router.getCurrentRoute().id).toBe("lessons/8");

        outlet.destroy();
    });

    it("encodes href segments, rejects invalid canonical values, and reports ambiguous patterns", () => {
        const outlet = PageOutlet({ scrollOnRender: false });
        const itemPattern = createHashRouterRoutePattern({
            id: "item",
            pattern: "items/:slug",
            parse(params) {
                const slug = params.slug?.trim() ?? "";

                return slug ? { slug } : null;
            },
            create(params, routeId) {
                return {
                    id: routeId,
                    title: params.slug,
                    render: () => H2(params.slug)
                };
            }
        });
        const numberPattern = createHashRouterRoutePattern({
            id: "number",
            pattern: "numbers/:value",
            parse(params) {
                const value = parsePositiveNumber(params.value);

                return value === null ? null : { value };
            },
            create(params, routeId) {
                return {
                    id: routeId,
                    title: String(params.value),
                    render: () => H2(String(params.value))
                };
            }
        });
        const duplicatePattern = createHashRouterRoutePattern({
            id: "duplicate",
            pattern: "items/:slug",
            parse(params) {
                const slug = params.slug?.trim() ?? "";

                return slug ? { slug } : null;
            },
            create(params, routeId) {
                return {
                    id: routeId,
                    title: params.slug,
                    render: () => H2(params.slug)
                };
            }
        });
        const router = createHashRouter({
            routes: [{
                id: "home",
                title: "Home",
                render: () => H2("Home")
            }],
            routePatterns: [itemPattern, numberPattern],
            outlet
        });
        const ambiguousRouter = createHashRouter({
            routes: [{
                id: "home",
                title: "Home",
                render: () => H2("Home")
            }],
            routePatterns: [itemPattern, duplicatePattern],
            outlet
        });

        expect(itemPattern.getHref({ slug: "two words" })).toBe("#items/two%20words");
        expect(router.getRouteById("#items/two%20words")?.id).toBe("items/two words");
        expect(router.getRouteById("#numbers/01")).toBeNull();
        expect(router.getRouteById("#numbers/none")).toBeNull();
        expect(router.getRouteById("#items/%E0")).toBeNull();
        expect(() => ambiguousRouter.getRouteById("#items/example")).toThrow(
            "matches both patterns"
        );

        outlet.destroy();
    });

    it("creates Screen routes and explicit dynamic breadcrumb trails", () => {
        const routePattern = createAppScreenRoutePattern({
            id: "lesson.materials",
            pattern: "lessons/:lessonNumber/materials",
            parse(params) {
                const lessonNumber = parsePositiveNumber(params.lessonNumber);

                return lessonNumber === null ? null : { lessonNumber };
            },
            create(params) {
                return {
                    title: `Lesson ${params.lessonNumber} materials`,
                    parentId: `lessons/${params.lessonNumber}`,
                    children: () => H2("Materials")
                };
            }
        });
        const lesson = routePattern.match("lessons/2/materials");
        const lessons: AppRouteDescriptor = {
            id: "lessons",
            title: "Lessons"
        };
        const lessonHub: AppRouteDescriptor = {
            id: "lessons/2",
            title: "Lesson 2"
        };

        expect(lesson?.id).toBe("lessons/2/materials");
        expect(lesson?.parentId).toBe("lessons/2");

        const breadcrumbs = RouteBreadcrumbs<AppRouteDescriptor>({
            routes: [lessons],
            current: lesson ?? null,
            getTrail() {
                return lesson ? [lessons, lessonHub, lesson] : [lessons];
            }
        });

        expect(breadcrumbs.element.textContent).toContain("Lessons");
        expect(breadcrumbs.element.textContent).toContain("Lesson 2");
        expect(breadcrumbs.element.textContent).toContain("Lesson 2 materials");
        expect(breadcrumbs.element.querySelector<HTMLAnchorElement>("a[href='#lessons/2']"))
            .not.toBeNull();

        breadcrumbs.destroy();
    });
});
