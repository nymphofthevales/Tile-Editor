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
    set background(imageUrl: string) {
        this.reference.style.backgroundImage = `url(\'${imageUrl}\')`
    }
}