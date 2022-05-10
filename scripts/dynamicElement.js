export class DynamicElement {
    constructor(documentReference) {
        this.reference = documentReference;
    }
    hide() {
        this.reference.classList.add('hidden');
    }
    show() {
        this.reference.classList.remove("hidden");
    }
    set background(imageUrl) {
        this.reference.style.backgroundImage = `url(\'${imageUrl}\')`;
    }
}
