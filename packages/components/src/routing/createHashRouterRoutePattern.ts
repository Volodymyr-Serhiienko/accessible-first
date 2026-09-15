import type { HashRouterRoute } from "./createHashRouter";

/** Raw decoded parameter values extracted from a hash route pattern. */
export type HashRouterRoutePatternRawParams = Readonly<Record<string, string>>;

/**
 * Untyped route matcher accepted by HashRouter.
 *
 * Applications normally create this through createHashRouterRoutePattern().
 */
export interface HashRouterRouteMatcher<TRoute extends HashRouterRoute = HashRouterRoute> {
    /** Stable identifier for diagnostics and application-owned references. */
    readonly id: string;
    /** Human-readable pattern using literal segments and :parameter segments. */
    readonly pattern: string;
    /** Resolves one concrete route, or null when the value does not match. */
    match(routeId: string): TRoute | null;
}

/** Options for createHashRouterRoutePattern(). */
export interface HashRouterRoutePatternOptions<
    TRoute extends HashRouterRoute,
    TParams extends object
> {
    /** Stable pattern definition identifier. */
    id: string;
    /** Slash-separated pattern with literal and :parameter segments. */
    pattern: string;
    /**
     * Validates and converts decoded parameter strings.
     * Return null when the values are not a valid route instance.
     */
    parse(params: HashRouterRoutePatternRawParams): TParams | null;
    /**
     * Creates the concrete route for validated params and its canonical route id.
     * Return null when application state makes the route unavailable.
     */
    create(params: TParams, routeId: string): TRoute | null;
}

/**
 * Typed hash route pattern with canonical route-id and href builders.
 */
export interface HashRouterRoutePattern<
    TRoute extends HashRouterRoute = HashRouterRoute,
    TParams extends object = object
> extends HashRouterRouteMatcher<TRoute> {
    /** Returns the canonical decoded route id for validated parameter values. */
    getRouteId(params: TParams): string;
    /** Returns an encoded hash href for validated parameter values. */
    getHref(params: TParams): string;
}

type HashRouterRoutePatternSegment =
    | { readonly kind: "literal"; readonly value: string }
    | { readonly kind: "parameter"; readonly name: string };

const parameterNamePattern = /^[A-Za-z][A-Za-z0-9_-]*$/;

function normalizePattern(value: string): string {
    return value
        .trim()
        .replace(/^#/, "")
        .replace(/^\/+|\/+$/g, "");
}

function parsePattern(pattern: string): readonly HashRouterRoutePatternSegment[] {
    const normalized = normalizePattern(pattern);

    if (!normalized) {
        throw new Error("Hash route pattern must contain at least one segment.");
    }

    const parameterNames = new Set<string>();

    return normalized.split("/").map((segment) => {
        if (!segment) {
            throw new Error(`Hash route pattern "${pattern}" contains an empty segment.`);
        }

        if (!segment.startsWith(":")) {
            if (segment.includes(":")) {
                throw new Error(`Hash route pattern segment "${segment}" must be literal or one :parameter.`);
            }

            return { kind: "literal", value: segment };
        }

        const name = segment.slice(1);

        if (!parameterNamePattern.test(name)) {
            throw new Error(`Hash route pattern parameter "${segment}" has an invalid name.`);
        }

        if (parameterNames.has(name)) {
            throw new Error(`Hash route pattern "${pattern}" repeats parameter "${name}".`);
        }

        parameterNames.add(name);

        return { kind: "parameter", name };
    });
}

function decodeSegment(value: string): string | null {
    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
}

function getRouteSegments(value: string): string[] | null {
    const normalized = normalizePattern(value);

    if (!normalized) return [];

    const segments = normalized.split("/");
    const decodedSegments: string[] = [];

    for (const segment of segments) {
        if (!segment) return null;

        const decoded = decodeSegment(segment);

        if (decoded === null) return null;
        decodedSegments.push(decoded);
    }

    return decodedSegments;
}

function getParameterValue<TParams extends object>(params: TParams, name: string): string {
    const value = (params as Record<string, unknown>)[name];

    if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(`Hash route pattern parameter "${name}" must be a string or number.`);
    }

    const text = String(value).trim();

    if (!text || text.includes("/")) {
        throw new Error(`Hash route pattern parameter "${name}" must be one non-empty path segment.`);
    }

    return text;
}

function getPatternRouteId<TParams extends object>(
    segments: readonly HashRouterRoutePatternSegment[],
    params: TParams
): string {
    return segments.map((segment) => (
        segment.kind === "literal"
            ? segment.value
            : getParameterValue(params, segment.name)
    )).join("/");
}

function getPatternHref(routeId: string): string {
    return `#${routeId.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`;
}

/**
 * Creates a typed, validated matcher for a family of hash route instances.
 *
 * Patterns deliberately support only literal segments and whole :parameters.
 * Use parse() for domain validation rather than embedding product rules into
 * a path expression.
 */
export function createHashRouterRoutePattern<
    TRoute extends HashRouterRoute,
    TParams extends object
>(options: HashRouterRoutePatternOptions<TRoute, TParams>): HashRouterRoutePattern<TRoute, TParams> {
    const id = options.id.trim();
    const pattern = normalizePattern(options.pattern);
    const segments = parsePattern(pattern);

    if (!id) {
        throw new Error("Hash route pattern id must not be empty.");
    }

    function getRouteId(params: TParams): string {
        return getPatternRouteId(segments, params);
    }

    return {
        id,
        pattern,
        getRouteId,

        getHref(params: TParams): string {
            return getPatternHref(getRouteId(params));
        },

        match(value: string): TRoute | null {
            const routeSegments = getRouteSegments(value);

            if (!routeSegments || routeSegments.length !== segments.length) return null;

            const rawParams: Record<string, string> = {};

            for (let index = 0; index < segments.length; index += 1) {
                const segment = segments[index] as HashRouterRoutePatternSegment;
                const valueSegment = routeSegments[index] as string;

                if (segment.kind === "literal") {
                    if (segment.value !== valueSegment) return null;
                    continue;
                }

                rawParams[segment.name] = valueSegment;
            }

            const params = options.parse(rawParams);

            if (params === null) return null;

            const routeId = getRouteId(params);

            if (routeId !== routeSegments.join("/")) return null;

            const route = options.create(params, routeId);

            if (route === null) return null;

            if (route.id !== routeId) {
                throw new Error(`Hash route pattern "${id}" must create a route with id "${routeId}".`);
            }

            return route;
        }
    };
}
