import { Form } from "./scripts/form.js";
import { GridController } from "./scripts/controller.js";
import { DynamicElement } from "./scripts/dynamicElement.js";
let controller;
let main_menu = new DynamicElement(document.getElementById("main-menu"));
let application = new DynamicElement(document.getElementById("application-frame"));
let setupForm = new Form("map-setup-frame");
setupForm.addInput("width", "NEWMAP-WIDTH");
setupForm.addInput("height", "NEWMAP-HEIGHT");
setupForm.addInput("tileset", "NEWMAP-TILESET");
setupForm.submit = "NEWMAP-SUBMIT";
setupForm.submitAction = () => {
    let parameters = setupForm.read();
    let w = parseInt(parameters.width);
    let h = parseInt(parameters.height);
    let set = parameters.tileset;
    let target = document.getElementById('grid-mount');
    console.log(set);
    controller = new GridController(w, h, target, set);
    startEditor();
    setupForm.clearInputs();
    setupForm.hide();
};
setupForm.close = "NEWMAP-CLOSE";
setupForm.closeAction = () => {
    setupForm.hide();
    setupForm.clearInputs();
};
function startEditor() {
    controller.start();
    main_menu.hide();
    application.show();
}
document.getElementById("MENU-NEW").addEventListener('mouseup', () => {
    setupForm.clearInputs();
    setupForm.show();
});
document.getElementById("CTRL-BASIC-MOVE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-FILL").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-COPY").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-PASTE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-DELETE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-CELL").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-ROW").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-COLUMN").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-AREA").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-ADD").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-REMOVE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-ADJUST").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-ALL").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-CLEAR").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-UNDO").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-REDO").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-EXPAND").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-SHRINK").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-CROP").addEventListener('mouseup', () => {
});
