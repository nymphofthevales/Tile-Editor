import { extractExtension, extractFilename } from "./file_helpers.js";
import { GridController } from "./controller.js";
import { DynamicElement } from "./dynamicElement.js";
import { capitalize } from "./string_helpers.js";
import { dataForm } from "./application_forms.js";
const fs = require("fs");
let target = document.getElementById('grid-mount');
let main_menu = new DynamicElement(document.getElementById("main-menu"));
let application = new DynamicElement(document.getElementById("application-frame"));
export function fillSavesMenu(selectorID) {
    let saves = fs.readdirSync("./saves");
    let selector = document.getElementById(selectorID);
    selector.innerHTML = "";
    saves.forEach((filename, index, array) => {
        let ext = extractExtension(filename);
        let name = capitalize(extractFilename(filename));
        let option = document.createElement("option");
        if (ext == "json") {
            selector.appendChild(option).id = `${name}-selector`;
            let currentOption = document.getElementById(`${name}-selector`);
            currentOption.textContent = name;
            currentOption.value = name;
        }
    });
}
export function fillTilesetsMenu() {
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
export function startFromNew(setupForm, controller) {
    let { width, height, tileset } = setupForm.read();
    width = parseInt(width);
    height = parseInt(height);
    controller = new GridController(width, height, target, tileset);
    startEditor(controller);
    setupForm.hide();
    return controller;
}
export function startFromLoad(loadForm, controller) {
    let { presetName } = loadForm.read();
    let save = JSON.parse(fs.readFileSync("./saves/" + presetName + ".json"));
    let tileset = save.tileset;
    let presetGrid = save.grid;
    controller = new GridController(0, 0, target, tileset, presetGrid);
    startEditor(controller);
    loadForm.hide();
    return controller;
}
function startEditor(controller) {
    controller.start();
    main_menu.hide();
    application.show();
}
export function endEditor(controller) {
    //controller.export()
    controller.endSession();
    main_menu.show();
    application.hide();
}
export function saveCurrentMap(saveForm, controller) {
    let { filename, crop } = saveForm.read();
    if (crop) {
        controller.cropWorkspace();
    }
    controller.export(filename);
    saveForm.hide();
}
export function addToCurrentMap(addForm, controller) {
    let { mapName, crop, direction } = addForm.read();
    if (crop) {
        controller.cropWorkspace();
    }
    let other = JSON.parse(fs.readFileSync("./saves/" + mapName + ".json"));
    other = other.grid;
    console.log(other);
    console.log(direction);
    controller.addGrid(other, direction);
    addForm.hide();
}
export function setAddFormDirection(addForm, direction) {
    let previouslySelected = addForm.inputs.direction.value;
    console.log(previouslySelected);
    addForm.inputs.direction["value"] = direction;
    if (previouslySelected != undefined) {
        let previousID = "DIRECTION-" + previouslySelected.toUpperCase();
        let previous = document.getElementById(previousID);
        previous.classList.remove("selected-direction");
    }
    let currentID = "DIRECTION-" + direction.toUpperCase();
    let current = document.getElementById(currentID);
    current.classList.add("selected-direction");
    current.blur();
}
let lastEditedCell;
export function activateDataEditor(cellXY, cellData, controller) {
    dataForm.inputs['data'].value = JSON.stringify(cellData);
    document.getElementById("DATA-ENTRY-LABEL").textContent += ` for ${JSON.stringify(cellXY)}`;
    lastEditedCell = controller.workingGrid.cell(cellXY);
    dataForm.show();
}
export function appendCellData(dataForm, controller) {
    let { data } = dataForm.read();
    lastEditedCell.data = JSON.parse(data);
    resetCellDataWindow();
    dataForm.hide();
}
export function resetCellDataWindow() {
    document.getElementById("DATA-ENTRY-LABEL").textContent = `Cell Data`;
}
