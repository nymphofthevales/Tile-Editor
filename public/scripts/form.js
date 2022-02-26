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
    read() {
        for (let key in this.inputs) {
            let element = this.inputs[key];
            this.values[key] = element.value;
        }
        return this.values;
    }
    clearInputs() {
        for (let element in this.inputs) {
            this.inputs[element].value = "";
        }
    }
    set submit(id) {
        this._submit = document.getElementById(id);
    }
    set submitAction(callback) {
        this._submit.addEventListener("mouseup", callback);
    }
    set close(id) {
        this._close = document.getElementById(id);
    }
    set closeAction(callback) {
        this._close.addEventListener("mouseup", callback);
    }
}
