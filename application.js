import { Form } from "./scripts/form.js";
import { GridController } from "./scripts/controller.js";
import { DynamicElement } from "./scripts/dynamicElement.js";
import { GridIOManager } from "./scripts/gridio.js";
import { extractExtension, extractFilename } from "./scripts/file_helpers.js";
import { capitalize } from "./scripts/string_helpers.js";
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
    setupForm.hide();
};
setupForm.closeInput = "NEWMAP-CLOSE";
setupForm.onClose = () => {
    setupForm.hide();
};
document.getElementById("MENU-NEW").addEventListener('mouseup', () => {
    fillTilesetsMenu();
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
};
loadForm.closeInput = "LOADMAP-CLOSE";
loadForm.onClose = () => {
    loadForm.hide();
};
document.getElementById("MENU-LOAD").addEventListener('mouseup', () => {
    fillSavesMenu();
    loadForm.show();
});
function fillSavesMenu() {
    let saves = fs.readdirSync("./saves");
    let selector = document.getElementById("LOADMAP-SELECTOR");
    saves.forEach((filename, index, array) => {
        let ext = extractExtension(filename);
        let name = capitalize(extractFilename(filename));
        let option = document.createElement("option");
        if (ext == "json") {
            if (document.getElementById(`${name}-selector`) == null) {
                selector.appendChild(option).id = `${name}-selector`;
                let currentOption = document.getElementById(`${name}-selector`);
                currentOption.textContent = name;
                currentOption.value = name;
            }
        }
    });
}
function fillTilesetsMenu() {
    let tilesets = fs.readdirSync("./tilesets");
    let selector = document.getElementById("NEWMAP-TILESET");
    tilesets.forEach((dirname, index, array) => {
        if (!dirname.includes(".")) {
            if (document.getElementById(`${dirname}-selector`) == null) {
                let option = document.createElement("option");
                selector.appendChild(option).id = `${dirname}-selector`;
                let currentOption = document.getElementById(`${dirname}-selector`);
                let tilesetName;
                try {
                    tilesetName = JSON.parse(fs.readFileSync(`./tilesets/${dirname}/specifications.json`)).name;
                }
                catch (err) {
                    tilesetName = "Untitled Tileset";
                }
                currentOption.textContent = tilesetName;
                currentOption.value = dirname;
            }
        }
    });
}
//TEMP//
document.getElementById("CTRL-NAV-QUIT").addEventListener('mouseup', () => {
    controller.export();
});
