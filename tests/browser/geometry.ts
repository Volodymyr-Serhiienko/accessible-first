import "../../packages/components/src/styles/index.css";
import { Button, Dialog, Section, Stack } from "../../packages/components/src";
import { createDismissableLayer, type DismissableLayer } from "../../packages/core/src/dismissable-layer";
import { createOverlayStack } from "../../packages/core/src/overlay-stack";
import { createPopoverPosition } from "../../packages/core/src/popover-position";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width: 48rem; margin: auto; padding: 1rem;";
const title = document.createElement("h1");
title.textContent = "AF Overlay Geometry And Stack Contracts";
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const report = document.createElement("ol");
const probe = Stack().element;
const near = (a: number, b: number) => Math.abs(a - b) < 1;

const run = Button({ text: "Run geometry and stack checks", onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    const container = document.createElement("div");
    container.style.cssText = "position:relative;width:280px;height:160px;overflow:auto;border:5px solid;";
    const canvas = document.createElement("div");
    canvas.style.cssText = "width:600px;height:400px;";
    const anchor = document.createElement("button");
    anchor.textContent = "Position anchor";
    anchor.style.cssText = "position:absolute;left:120px;top:100px;width:90px;height:30px;";
    const popup = document.createElement("div");
    popup.textContent = "Positioned content";
    popup.style.cssText = "width:150px;height:60px;box-sizing:border-box;border:1px solid;";
    canvas.append(anchor, popup);
    container.append(canvas);
    probe.append(container);
    container.scrollLeft = 30;
    container.scrollTop = 50;
    const absolute = createPopoverPosition(anchor, popup, { strategy: "absolute", shift: false, flip: false, autoUpdate: false });
    check("Absolute coordinates respect bordered/scrolled offset parent", near(popup.getBoundingClientRect().left, anchor.getBoundingClientRect().left)
        && near(popup.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom + 4));
    container.scrollTop += 20;
    absolute.update();
    check("Absolute position follows inner scroll without document-offset drift", near(popup.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom + 4));
    anchor.style.direction = "rtl";
    absolute.update();
    check("Live RTL start aligns the right edges", near(popup.getBoundingClientRect().right, anchor.getBoundingClientRect().right));
    absolute.destroy();
    container.remove();

    anchor.style.cssText = `position:fixed;left:${innerWidth - 45}px;top:${innerHeight - 35}px;width:30px;height:20px;`;
    popup.style.cssText = "width:180px;height:100px;box-sizing:border-box;border:1px solid;";
    probe.append(anchor, popup);
    const fixed = createPopoverPosition(anchor, popup, { autoUpdate: false });
    check("Bottom-edge collision flips above the anchor", fixed.getState()?.side === "top");
    const bounds = popup.getBoundingClientRect();
    check("Collision shift keeps a fitting popup inside the viewport", bounds.left >= 7 && bounds.right <= innerWidth - 7 && bounds.top >= 7 && bounds.bottom <= innerHeight - 7);
    fixed.destroy();
    anchor.remove();
    popup.remove();

    const beforeBody = document.body.style.cssText;
    run.element.focus();
    parent.open();
    child.trigger.focus();
    child.open();
    check("Nested modal dialogs lock the document", document.body.style.position === "fixed" && document.documentElement.style.overflow === "hidden");
    child.close();
    check("Closing the inner dialog preserves the outer scroll lock", parent.isOpen() && document.body.style.position === "fixed" && document.activeElement === child.trigger);
    parent.close();
    check("Final close restores body styles and opener focus", document.body.style.cssText === beforeBody && document.activeElement === run.element);

    report.replaceChildren(...results.map((result) => {
        const row = document.createElement("li");
        row.dataset.passed = `${result.passed}`;
        row.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
        return row;
    }));
    summary.textContent = `${results.filter((result) => result.passed).length}/${results.length} passed.`;
    run.element.focus();
} });

const child = Dialog({ trigger: "Open inner dialog", title: "Inner dialog" });
const parent = Dialog({ trigger: "Open outer dialog", title: "Outer dialog", children: [child] });
const stack = createOverlayStack();
let layers: DismissableLayer[] = [];
let dismissed = 0;
const stackStatus = document.createElement("p");
stackStatus.setAttribute("role", "status");
const layerElements = [document.createElement("div"), document.createElement("div")];
const reset = Button({ text: "Activate reordered layers", onPress() {
    for (const layer of layers) layer.destroy();
    dismissed = 0;
    layers = layerElements.map((element) => {
        const layer = createDismissableLayer(element, { overlayStack: stack, onDismiss() {
            layer.deactivate();
            dismissed += 1;
            stackStatus.textContent = `Dismissed: ${dismissed}; active: ${stack.getEntries().length}`;
        } });
        return layer;
    });
    stack.bringToFront(stack.getEntries()[0]!);
    stackStatus.textContent = "Dismissed: 0; active: 2";
} });
const outside = Button({ text: "Outside pointer target" });
app.append(title, run.element, summary, report, probe, parent.element,
    Section({ title: "Reordered stack", children: [reset, outside, stackStatus, ...layerElements] }).element);
