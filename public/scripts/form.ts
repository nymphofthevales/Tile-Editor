import { DynamicElement } from "./dynamicElement.js"

export class Form extends DynamicElement {
    _housing: HTMLElement
    inputs = {}
    values = {}
    _submit: HTMLElement
    _close: HTMLElement
    constructor(id: string) {
        super(document.getElementById(id))
        this._housing = document.getElementById(id)
    }
    addInput(name:string, id: string): void {
        this.inputs[name] = document.getElementById(id)
    }
    read(): any {
        for (let key in this.inputs) {
            let element = this.inputs[key]
            this.values[key] = element.value
        }
        return this.values
    }
    clearInputs() {
        for (let element in this.inputs) {
            this.inputs[element].value = ""
        }
    }
    set submit(id) {
        this._submit = document.getElementById(id)
    }
    set submitAction(callback: EventListenerOrEventListenerObject) {
        this._submit.addEventListener("mouseup", callback)
    }
    set close(id) {
        this._close = document.getElementById(id)
    }
    set closeAction(callback: EventListenerOrEventListenerObject) {
        this._close.addEventListener("mouseup", callback) 
    }
}