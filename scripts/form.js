import { DynamicElement } from "./dynamicElement.js";
export class Form extends DynamicElement {
    constructor(id) {
        super(document.getElementById(id));
        this.inputs = {};
        this.values = {};
        this._housing = document.getElementById(id);
    }
    addInput(name, id) {
        this.inputs[name] = document.getElementById(id);
    }
    /**
     * Returns object in the form of:
     * {
     *   "inputName": value,
     * }
     * with a key value pair for each input in the form.
    */
    read() {
        for (let key in this.inputs) {
            let element = this.inputs[key];
            if (element.type == "checkbox") {
                this.values[key] = element.checked;
            }
            else {
                this.values[key] = element.value;
            }
        }
        return this.values;
    }
    clearInputs() {
        for (let element in this.inputs) {
            this.inputs[element].value = "";
        }
    }
    set submitInput(id) {
        this._submit = document.getElementById(id);
    }
    set onSubmit(callback) {
        this._submit.addEventListener("mouseup", callback);
    }
    set closeInput(id) {
        this._close = document.getElementById(id);
    }
    set onClose(callback) {
        this._close.addEventListener("mouseup", callback);
    }
}
