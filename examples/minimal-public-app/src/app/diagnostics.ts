import { type PublicHashRoutedAppDiagnosticsOptions } from "../../../../packages/components/src";

export function getDiagnosticsOptions(): PublicHashRoutedAppDiagnosticsOptions {
    return {
        logOnRouteChange: true,
        pageOptions: {
            landmarks: {
                requireNavigation: false
            }
        }
    };
}
