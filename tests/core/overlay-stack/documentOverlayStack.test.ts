import {
    describe,
    expect,
    it
} from "vitest";
import {
    createDismissableLayer
} from "../../../packages/core/src/dismissable-layer";

type TestWindow = Window & typeof globalThis;

interface TestDocument {
    readonly document: Document;
    readonly window: TestWindow;
}

function createTestDocument(): TestDocument {
    const frame = document.createElement("iframe");

    document.body.append(frame);

    const ownerDocument = frame.contentDocument;
    const ownerWindow = frame.contentWindow as TestWindow | null;

    if (!ownerDocument || !ownerWindow) {
        throw new Error("Expected iframe document and window.");
    }

    return {
        document: ownerDocument,
        window: ownerWindow
    };
}

function createLayerElement(ownerDocument: Document): HTMLElement {
    const element = ownerDocument.createElement("div");

    ownerDocument.body.append(element);

    return element;
}

describe("document-owned overlay stacks", () => {
    it("keeps active overlays isolated between browser documents", () => {
        const first = createTestDocument();
        const second = createTestDocument();
        let firstDismissals = 0;
        let secondDismissals = 0;

        const firstLayer = createDismissableLayer(
            createLayerElement(first.document),
            {
                onDismiss() {
                    firstDismissals += 1;
                }
            }
        );

        const secondLayer = createDismissableLayer(
            createLayerElement(second.document),
            {
                onDismiss() {
                    secondDismissals += 1;
                }
            }
        );

        first.document.dispatchEvent(new first.window.KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        }));

        expect(firstDismissals).toBe(1);
        expect(secondDismissals).toBe(0);

        second.document.dispatchEvent(new second.window.KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true
        }));

        expect(firstDismissals).toBe(1);
        expect(secondDismissals).toBe(1);

        firstLayer.destroy();
        secondLayer.destroy();
    });
});
