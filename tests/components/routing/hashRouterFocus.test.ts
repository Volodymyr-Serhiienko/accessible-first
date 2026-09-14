import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";
import {
  H2
} from "../../../packages/components/src/composition";
import { Button } from "../../../packages/components/src/button";
import { PageOutlet } from "../../../packages/components/src/page-outlet";
import { createHashRouter } from "../../../packages/components/src/routing";

afterEach(() => {
  document.body.replaceChildren();
});

function makeVisible(element: HTMLElement): void {
  Object.defineProperty(element, "getClientRects", {
    configurable: true,
    value: () => [{}]
  });
}

describe("HashRouter route focus", () => {
  it("uses a route focusTarget unless a navigation call overrides it", () => {
    const firstAction = Button({ text: "Next" });
    const outlet = PageOutlet({ scrollOnRender: false });

    document.body.append(outlet.element);
    makeVisible(firstAction.element);

    const router = createHashRouter({
      routes: [{
        id: "learn",
        title: "Learn lesson",
        focusTarget: "first-focusable",
        render: () => [H2("Learn lesson"), firstAction]
      }],
      outlet
    });

    router.navigate("learn", {
      scroll: false,
      announcement: false
    });

    expect(document.activeElement).toBe(firstAction.element);

    router.navigate("learn", {
      scroll: false,
      focusTarget: "outlet",
      announcement: false
    });

    expect(document.activeElement).toBe(outlet.element);

    outlet.destroy();
  });
});
