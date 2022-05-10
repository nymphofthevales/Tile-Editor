export class DynamicElement {
    reference: HTMLElement
    constructor(documentReference: HTMLElement) {
        this.reference = documentReference
    }
    hide() {
        this.reference.classList.add('hidden')
    }
    show() {
        this.reference.classList.remove("hidden")
    }
    clear() {
        this.reference.innerHTML = ""
    }
    /**
     * Sets the background of an element. Automatically includes css url() wrapper.
    */
    set background(imageUrl: string) {
        this.reference.style.backgroundImage = `url(\'${imageUrl}\')`
    }
}