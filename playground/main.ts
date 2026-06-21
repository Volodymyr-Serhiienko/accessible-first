import { createId } from "../packages/core/src/id";

const app = document.querySelector("#app");

if (app) {
    app.textContent = `
Playground started

${createId()}
${createId()}
${createId("dialog")}
`;
}