import "../../packages/components/src/styles/index.css";
import { Button, Form, Section, Stack, TextField, ToastViewport } from "../../packages/components/src";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width: 48rem; margin: auto; padding: 1rem;";
const heading = document.createElement("h1");
heading.textContent = "AF Form And Feedback Contracts";
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const report = document.createElement("ol");
const probe = Stack().element;
const pause = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const messages = () => [...document.querySelectorAll("[data-af-live-region]")].map((node) => node.textContent ?? "").join(" ");

async function runChecks(): Promise<void> {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    run.element.setAttribute("aria-busy", "true");
    const first = TextField({ label: "Hidden name", required: true });
    const second = TextField({ label: "Visible name", required: true });
    const form = Form({ children: [first, second], scrollFirstInvalid: false });
    probe.append(form.element);
    first.element.hidden = true;
    run.element.focus();
    const invalid = form.validate();
    check("Real hidden field is skipped for focus, not validation", document.activeElement === second.control && invalid.invalidResults.length === 2);
    form.validate();
    await pause(60);
    check("An already focused invalid field still produces aggregate feedback", messages().includes("Visible name"));
    second.element.hidden = true;
    run.element.focus();
    form.validate();
    await pause(60);
    check("Unreachable errors are announced without moving focus", document.activeElement === run.element && messages().includes("Hidden name"));
    second.element.hidden = false;
    second.control.value = "Draft";
    const cancel = (event: Event) => event.preventDefault();
    form.element.addEventListener("reset", cancel);
    form.reset();
    await pause(30);
    check("Canceled native reset retains values, validation and focus", second.control.value === "Draft"
        && form.element.getAttribute("data-af-validation-state") === "invalid" && document.activeElement === run.element);
    form.element.removeEventListener("reset", cancel);
    form.reset();
    await pause(30);
    check("Successful reset selects the first reachable field", document.activeElement === second.control && second.control.value === "");
    form.destroy();
    form.element.remove();

    let resetCount = 0;
    const late = Form({ onReset: () => { resetCount += 1; } });
    probe.append(late.element);
    late.reset();
    late.destroy();
    late.reset();
    await pause(30);
    check("Destroyed form cancels and rejects deferred reset work", resetCount === 0 && !late.validate().valid);
    late.element.remove();

    const viewport = ToastViewport({ duration: 80, limit: 1 });
    probe.append(viewport.element);
    run.element.focus();
    const toast = viewport.show({ description: "Saved", actionText: "Undo" });
    const action = () => toast.element.querySelector<HTMLButtonElement>("[data-af-toast-action]")!;
    check("Showing a toast does not move focus", document.activeElement === run.element);
    action().focus();
    await pause(120);
    check("Keyboard focus pauses real auto-dismiss", !toast.isClosed() && document.activeElement === action());
    toast.update({ description: "Saved again" });
    check("Toast update preserves the focused control", document.activeElement === action());
    toast.element.dispatchEvent(new PointerEvent("pointerleave"));
    await pause(120);
    check("Pointer leave cannot restart a keyboard-paused timer", !toast.isClosed());
    const background = viewport.show("Background message");
    check("Visible limit protects the focused notification", !toast.isClosed() && background.isClosed());
    toast.close("dismiss");
    check("Explicit close returns focus to its entry control", document.activeElement === run.element);
    const expiry = viewport.show("Expiry message");
    expiry.element.querySelector<HTMLButtonElement>("button")!.focus();
    run.element.focus();
    await pause(120);
    check("Leaving a toast resumes expiry without stealing focus", expiry.isClosed() && document.activeElement === run.element);
    viewport.destroy();
    viewport.element.remove();

    report.replaceChildren(...results.map((result) => {
        const row = document.createElement("li");
        row.dataset.passed = `${result.passed}`;
        row.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
        return row;
    }));
    summary.textContent = `${results.filter((result) => result.passed).length}/${results.length} passed.`;
    run.element.removeAttribute("aria-busy");
    run.element.focus();
    run.element.scrollIntoView({ block: "start" });
}

const run = Button({ text: "Run form and feedback checks", onPress: () => { void runChecks(); } });
const name = TextField({ label: "Profile name", required: true, validationMessages: { valueMissing: "Enter your profile name." } });
const manual = Form({
    children: [name],
    actions: [Button({ text: "Submit profile", type: "submit" }), Button({ text: "Reset profile", type: "reset" })]
});
const notifications = ToastViewport({ duration: 5000 });
const show = Button({ text: "Show timed notification", onPress: () => {
    notifications.closeAll();
    notifications.show({ description: "Profile saved", actionText: "Keep notification", onAction: (event) => event.preventDefault() });
} });
app.append(heading, run.element, summary, report, probe,
    Section({ title: "Native form", children: [manual] }).element,
    show.element, notifications.element);
