import {
    createAppIdentityRouteDocumentMetadataOptions,
    type AppIdentity,
    type AppIdentityRouteDiagnosticsOptions,
    type AppIdentityRouteDocumentMetadataOptions
} from "../app-identity";
import type {
    AppRouteDescriptor,
    AppRouteDocumentMetadataOptions
} from "../app-routes";
import type { LocaleCode } from "../localization";
import type { PublicRoutedAppDiagnosticsOptions } from "./createPublicRoutedAppDiagnostics";

/**
 * Resolves route document metadata options for public routed app recipes.
 */
export function createPublicAppRouteDocumentMetadataOptions<
    TRoute extends AppRouteDescriptor
>(
    identity: AppIdentity | null | undefined,
    routeMetadata: AppIdentityRouteDocumentMetadataOptions<TRoute> | false | undefined
): AppRouteDocumentMetadataOptions<TRoute> | false | undefined {
    if (routeMetadata === false) return false;
    if (identity) return createAppIdentityRouteDocumentMetadataOptions(identity, routeMetadata ?? {});

    return routeMetadata;
}

/**
 * Adds public app identity defaults to diagnostics options without overwriting app-owned overrides.
 */
export function applyPublicAppIdentityDiagnosticsDefaults<
    TLocale extends LocaleCode,
    TKey extends string,
    TRoute extends AppRouteDescriptor
>(
    options: PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute>,
    identity: AppIdentity | null | undefined,
    routeMetadata: AppIdentityRouteDiagnosticsOptions<TRoute> | false | undefined
): PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> {
    const nextOptions: PublicRoutedAppDiagnosticsOptions<TLocale, TKey, TRoute> = {
        ...options
    };

    if (identity !== undefined && nextOptions.identity === undefined) {
        nextOptions.identity = identity;
    }

    if (routeMetadata !== undefined && routeMetadata !== false && nextOptions.routeOptions === undefined) {
        nextOptions.routeOptions = routeMetadata;
    }

    return nextOptions;
}
