import { afterAll, describe, expect, it } from "vitest";
import tokens from "../../packages/components/src/styles/tokens.css?raw";

const style = document.createElement("style");
style.textContent = tokens;
document.head.append(style);
const rules = [...style.sheet!.cssRules].filter((rule): rule is CSSStyleRule => "selectorText" in rule);
const light = rules.find(rule => rule.selectorText === ":root")!.style;
const dark = rules.find(rule => rule.selectorText === ':root[data-af-theme="dark"]')!.style;
afterAll(() => style.remove());

function luminance(color: string): number {
    const probe = document.createElement("span"); probe.style.color = color;
    const channels = probe.style.color.match(/[\d.]+/g)?.map(Number);
    if (!channels || channels.length !== 3) throw new Error(`Expected an opaque sRGB token, received ${color}`);
    return channels.map(value => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
        .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i]!, 0);
}
function contrast(first: string, second: string): number {
    const a = luminance(first); const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

for (const [theme, overrides] of [["light", light], ["dark", dark]] as const) {
    const token = (name: string) => overrides.getPropertyValue(`--af-color-${name}`).trim() || light.getPropertyValue(`--af-color-${name}`).trim();
    describe(`${theme} default token contrast`, () => {
        it.each([
            ["fg", "bg"], ["muted", "bg"], ["primary-fg", "primary"], ["danger-fg", "danger"],
            ["tooltip-fg", "tooltip-bg"], ["link", "bg"], ["link-visited", "bg"],
            ["fg", "surface-hover"], ["danger", "bg"], ["success", "bg"],
            ...["neutral", "info", "success", "warning", "danger"].map(status => [`status-${status}-fg`, `status-${status}-bg`])
        ])("keeps normal text %s on %s at 4.5:1", (foreground, background) => {
            expect(contrast(token(foreground!), token(background!))).toBeGreaterThanOrEqual(4.5);
        });
        it.each(["focus", "border"])("keeps %s visible against the default canvas at 3:1", foreground => {
            expect(contrast(token(foreground), token("bg"))).toBeGreaterThanOrEqual(3);
        });
    });
}
