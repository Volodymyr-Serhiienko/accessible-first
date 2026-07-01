import {
    createFocusTrap,
    containsFocus,
    hasFocusableElements
} from "../packages/core/src/focus";

document.querySelector("#app")!.innerHTML = `
<button id="open">
    Open dialog
</button>

<div
    id="dialog"
    style="
        border:1px solid;
        padding:1rem;
        width:300px;
    "
>

    <button>
        Save
    </button>

    <input>

    <button>
        Cancel
    </button>

</div>
`;

const dialog = document.querySelector(
    "#dialog"
) as HTMLElement;

const trap = createFocusTrap(dialog);

console.log(
    "Has focusable elements:",
    hasFocusableElements(dialog)
);

console.log(
    "Contains focus:",
    containsFocus(dialog)
);

document
    .querySelector("#open")
    ?.addEventListener(
        "click",
        () => {

            trap.activate();

            console.log(
                "Contains focus:",
                containsFocus(dialog)
            );
        }
    );