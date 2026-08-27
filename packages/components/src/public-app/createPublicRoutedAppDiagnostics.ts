import {
    createPublicAppDiagnosticsRunner,
    type AppDiagnosticsRunner,
    type PublicAppDiagnosticsInspectablePage,
    type PublicAppDiagnosticsPageResolver,
    type PublicAppDiagnosticsRoutesResolver,
    type PublicAppDiagnosticsRunnerOptions
} from "../app-diagnostics";
import type { AppRouteDescriptor } from "../app-routes";
import type { LocaleCode } from "../localization";

/**
 * App shell and route list used by public routed app diagnostics recipes.
 */
export interface PublicRoutedAppDiagnosticsTarget<
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> {
    readonly shell: PublicAppDiagnosticsInspectablePage;
    readonly routes: readonly TRoute[];
}

/**
 * Shared diagnostics options for public routed app recipes.
 */
export interface PublicRoutedAppDiagnosticsOptions<
    TLocale extends LocaleCode = LocaleCode,
    TKey extends string = string,
    TRoute extends AppRouteDescriptor = AppRouteDescriptor
> extends Omit<PublicAppDiagnosticsRunnerOptions<TLocale, TKey, TRoute>, "page" | "routes"> {
    /** Page diagnostics source. Defaults to the created app shell; pass false to omit page diagnostics. */
    page?: PublicAppDiagnosticsPageResolver | false;
    /** Route diagnostics source. Defaults to the app route list; pass false to omit route diagnostics. */
    routes?: PublicAppDiagnosticsRoutesResolver<TRoute> | false;
}

/**
 * Creates public diagnostics with app shell and route-list defaults.
 */
export function createPublicRoutedAppDiagnostics<
    TLocale extends LocaleCode,
    TKey extends string,
    TRoute extends AppRouteDescriptor
>(
    target: PublicRoutedAppDiagnosticsTarget<TRoute>,
    options: PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> | false | undefined
): AppDiagnosticsRunner | null {
    if (options === false) return null;

    const diagnosticsOptions = options ?? {};
    const {
        page,
        routes,
        ...runnerOptions
    } = diagnosticsOptions;
    const nextOptions: PublicAppDiagnosticsRunnerOptions<TLocale, TKey, TRoute> = {
        ...runnerOptions
    };

    if (page !== false) {
        nextOptions.page = page === undefined
            ? () => target.shell
            : page;
    }

    if (routes !== false) {
        nextOptions.routes = routes === undefined
            ? target.routes
            : routes;
    }

    return createPublicAppDiagnosticsRunner(nextOptions);
}
