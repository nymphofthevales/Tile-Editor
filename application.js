import { Form } from "./scripts/form.js";
import { GridController } from "./scripts/controller.js";
import { DynamicElement } from "./scripts/dynamicElement.js";
import { GridIOManager } from "./scripts/gridio.js";
const fs = require("fs");
let controller;
let IOManager = new GridIOManager();
let target = document.getElementById('grid-mount');
let main_menu = new DynamicElement(document.getElementById("main-menu"));
let application = new DynamicElement(document.getElementById("application-frame"));
let setupForm = new Form("map-setup-frame");
setupForm.addInput("width", "NEWMAP-WIDTH");
setupForm.addInput("height", "NEWMAP-HEIGHT");
setupForm.addInput("tileset", "NEWMAP-TILESET");
setupForm.submitInput = "NEWMAP-SUBMIT";
setupForm.onSubmit = () => {
    let { width, height, tileset } = setupForm.read();
    width = parseInt(width);
    height = parseInt(height);
    controller = new GridController(width, height, target, tileset);
    startEditor();
    setupForm.clearInputs();
    setupForm.hide();
};
setupForm.closeInput = "NEWMAP-CLOSE";
setupForm.onClose = () => {
    setupForm.hide();
    setupForm.clearInputs();
};
document.getElementById("MENU-NEW").addEventListener('mouseup', () => {
    setupForm.show();
});
function startEditor() {
    controller.start();
    main_menu.hide();
    application.show();
}
let loadForm = new Form("map-load-frame");
loadForm.addInput("presetName", "LOADMAP-SELECTOR");
loadForm.submitInput = "LOADMAP-SUBMIT";
loadForm.onSubmit = () => {
    let { presetName } = loadForm.read();
    let save = JSON.parse(fs.readFileSync("./saves/" + presetName + ".json"));
    let tileset = save.tileset;
    let presetGrid = save.grid;
    controller = new GridController(0, 0, target, tileset, presetGrid);
    startEditor();
    loadForm.hide();
    loadForm.clearInputs();
};
loadForm.closeInput = "LOADMAP-CLOSE";
loadForm.onClose = () => {
    loadForm.hide();
    loadForm.clearInputs();
};
document.getElementById("MENU-LOAD").addEventListener('mouseup', () => {
    loadForm.show();
});
//TEMP//
document.getElementById("CTRL-NAV-QUIT").addEventListener('mouseup', () => {
    controller.export();
});
