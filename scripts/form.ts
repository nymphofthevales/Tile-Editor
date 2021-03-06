import { DynamicElement } from "./dynamicElement.js"

interface FormReadout {
    [key: string]: any
}
interface InputMap {
    [key: string]: HTMLInputElement
}

export class Form extends DynamicElement {
    _housing: HTMLElement
    inputs: InputMap = {}
    values = {}
    _submit: HTMLElement
    _close: HTMLElement
    constructor(id: string) {
        super(document.getElementById(id))
        this._housing = document.getElementById(id)
    }
    addInput(name:string, id: string): void {
        this.inputs[name] = <HTMLInputElement>document.getElementById(id)
    }
    /**
     * Returns object in the form of:
     * {
     *   "inputName": value,
     * }
     * with a key value pair for each input in the form.
    */
    read(): FormReadout {
        for (let key in this.inputs) {
            let element = <HTMLInputElement>this.inputs[key]
            if (element.type == "checkbox") {
                this.values[key] = element.checked
            } else {
                this.values[key] = element.value
            }
        }
        return this.values
    }
    clearInputs() {
        for (let element in this.inputs) {
            this.inputs[element].value = ""
        }
    }
    set submitInput(id) {
        this._submit = document.getElementById(id)
    }
    set onSubmit(callback: EventListenerOrEventListenerObject) {
        this._submit.addEventListener("mouseup", callback)
    }
    set closeInput(id) {
        this._close = document.getElementById(id)
    }
    set onClose(callback: EventListenerOrEventListenerObject) {
        this._close.addEventListener("mouseup", callback) 
    }
}