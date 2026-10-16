import "../../packages/components/src/styles/index.css";
import { Button, Checkbox, RadioGroup, Select, Stack, Switch, TextField } from "../../packages/components/src";

const app = document.querySelector<HTMLElement>("#app")!;
app.style.cssText = "max-width:48rem;margin:auto;padding:1rem;font:16px/1.5 sans-serif";
const heading = document.createElement("h1");
heading.textContent = "AF Native Fields";
const long = "LongUnbrokenFieldLabelOrDescription".repeat(6);
const form = document.createElement("form");
const checkbox = Checkbox({ label: long, description: long, inputOptions: { attributes: { checked: true } } });
const toggle = Switch({ label: "Immediate setting", inputOptions: { attributes: { checked: true } } });
const rtlToggle = Switch({ label: "RTL setting", checked: true, attributes: { dir: "rtl" } });
rtlToggle.element.style.justifySelf = "start";
const radio = RadioGroup({ label: "Practice pace", items: [
    { value: "a", label: "Standard", defaultSelected: true },
    { value: "b", label: "Disabled option", disabled: true },
    { value: "c", label: long, description: long }
] });
const select = Select({ label: long, items: [{ value: "a", label: "Standard" }, { value: "b", label: long }] });
const text = TextField({ label: long, description: long, controlOptions: { attributes: { value: "Original value" } } });
const readonly = TextField({ label: "Read-only value", value: "Keep this value", readOnly: true });
const disabled = Checkbox({ label: "Disabled checkbox", disabled: true });
const invalid = Checkbox({ label: "Invalid checkbox", invalid: true, description: "Required for publishing", errorMessage: "Choose this option" });
const report = document.createElement("ol");
const summary = document.createElement("p");
summary.setAttribute("role", "status");
const reset = Button({ text: "Reset native form", type: "reset" });
const content = Stack({ children: [checkbox, toggle, rtlToggle, radio, select, text, readonly, disabled, invalid, reset] });
form.append(content.element);

const run = Button({ text: "Run field checks", async onPress() {
    const results: Array<{ name: string; passed: boolean }> = [];
    const check = (name: string, passed: boolean) => results.push({ name, passed });
    check("Existing checked markup is preserved", checkbox.isChecked() && toggle.isChecked());
    checkbox.setChecked(false);
    toggle.setChecked(false);
    radio.setValue("c");
    text.setValue("Changed value");
    form.reset();
    await Promise.resolve();
    check("Reset getters match native values", checkbox.isChecked() && toggle.isChecked() && radio.getValue() === radio.getSelectedInput()?.value && text.getValue() === "Original value");
    check("Reset refreshes ARIA and styling markers", checkbox.input.getAttribute("aria-checked") === "true" && toggle.input.getAttribute("aria-checked") === "true" && radio.items.every(item => item.input.getAttribute("data-af-checked") === String(item.input.checked)));
    check("Read-only stays focusable without disabled semantics", readonly.control.readOnly && !readonly.control.disabled);
    check("Description and error references are both retained", invalid.input.getAttribute("aria-describedby")?.includes(invalid.description.id) === true && invalid.input.getAttribute("aria-errormessage") === invalid.errorMessage.id);
    check("Native disabled option remains unavailable", radio.items[1]!.input.matches(":disabled"));
    const thumb = rtlToggle.element.querySelector<HTMLElement>("[data-af-switch-thumb]")!;
    thumb.style.transition = "none";
    rtlToggle.setChecked(false);
    const off = thumb.getBoundingClientRect();
    rtlToggle.setChecked(true);
    const on = thumb.getBoundingClientRect();
    check("RTL thumb moves toward the logical end inside its track", on.left < off.left && on.left >= thumb.parentElement!.getBoundingClientRect().left);
    check("Long labels and options do not overflow the document", document.documentElement.scrollWidth <= innerWidth);
    check("Field controls fit their parent width", [text.control, select.select].every(control => control.getBoundingClientRect().width <= control.parentElement!.getBoundingClientRect().width + 1));
    const validated = TextField({ label: "Validation probe", defaultValue: "Good", validator: value => value === "Good" ? null : "Bad value" });
    form.append(validated.element);
    validated.setValue("Bad");
    const result = validated.validate({ announce: false });
    check("Custom validation exposes its error relationship", !result.valid && validated.control.getAttribute("aria-errormessage") === validated.errorMessage.id);
    form.reset();
    await Promise.resolve();
    check("Native reset clears standalone custom validity and feedback", validated.getValue() === "Good" && validated.getValidationState() === "idle" && !validated.control.validity.customError && !validated.control.hasAttribute("aria-invalid"));
    validated.destroy();
    validated.element.remove();
    report.replaceChildren(...results.map(result => {
        const li = document.createElement("li");
        li.dataset.passed = String(result.passed);
        li.textContent = `${result.passed ? "PASS" : "FAIL"}: ${result.name}`;
        return li;
    }));
    summary.textContent = `${results.filter(result => result.passed).length}/${results.length} passed`;
    run.element.focus();
} });
app.append(heading, run.element, summary, report, form);
