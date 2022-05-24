import { GridRenderer, getCellReference } from "./renderer.js";
import { Grid } from "./grid.js";
import { GridIOManager } from "./gridio.js";
import { GridSelector } from "./selector.js";
import { Stack } from "./stack.js";
import { Tileset } from "./tileset.js";
import { addClassToAllMembers, removeClassFromAllMembers, forEachInClass } from "./dom_helpers.js";
import { DynamicElement } from "./dynamicElement.js";
import { extractDirectory } from "./file_helpers.js";
import { activateDataEditor } from "./menu_functions.js";
const fs = require("fs");
export class GridController {
    constructor(w, h, target = document.body, tilesetName, preset) {
        this.emptyTileEvaluator = (cellData) => { return cellData.tile == "none" || cellData.tile == undefined; };
        this.IOManager = new GridIOManager();
        if (preset) {
            this.workingGrid = this.IOManager.generateGridFromPreset(preset);
        }
        else {
            this.workingGrid = new Grid(w, h);
        }
        this.workingSelector = new GridSelector(this.workingGrid);
        let tileset = new Tileset(`./tilesets/${tilesetName}/`);
        this.workingRenderer = new GridRenderer(target, tileset);
        this.ident = this.workingRenderer.identifier;
        this.actionManager = new ActionManager(this);
        this.keyboardManager = new KeyboardManager(this);
        this.mouseManager = new MouseManager(this);
        this.zoomManager = new ZoomManager();
        let menu = document.getElementById("controller-menu");
        this.controllerMenu = new ControllerMenu(menu, this);
    }
    start() {
        this.render();
        this.mouseManager.setupListeners();
        this.keyboardManager.setupListeners();
        this.keyboardManager.zoomManager.setDefaultZoom();
    }
    render() {
        this.workingRenderer.dynamicRender(this.workingGrid, this.workingSelector);
        setTimeout(() => {
            this.controllerMenu.fillTileMenu(this.workingRenderer.tileset, "tile-selector-frame");
            this.workingRenderer.renderTileset(this.workingGrid);
        }, 500);
    }
    export(filename) {
        let savedGrid = this.IOManager.writeGridToPreset(this.workingGrid, this.emptyTileEvaluator);
        let save = {
            tileset: extractDirectory(this.workingRenderer.tileset._path),
            grid: savedGrid
        };
        let path;
        if (filename != undefined) {
            path = `./saves/${filename}.json`;
        }
        else {
            path = `./saves/autosave_${this.ident}.json`;
        }
        fs.writeFileSync(path, JSON.stringify(save));
        this.workingRenderer.resolveData_DocumentDeltas(this.workingGrid);
    }
    clearWorkspace() {
        this.workingGrid.forEachCell((cell) => {
            cell.data = { "tile": "none" };
        });
        this.workingRenderer.renderTileset(this.workingGrid);
    }
    cropWorkspace() {
        this.workingGrid.cropGrid(this.emptyTileEvaluator);
        this.workingRenderer.resolveData_DocumentDeltas(this.workingGrid);
    }
    addGrid(other, to) {
        let otherGrid = this.IOManager.generateGridFromPreset(other);
        this.workingGrid.concatenate(this.workingGrid, otherGrid, to);
        this.workingRenderer.redoRender(this.workingGrid);
        this.zoomManager.setZoom('grid-cell');
        this.mouseManager.setupListeners();
    }
    endSession() {
        this.controllerMenu.clearTileMenu();
        this.workingRenderer.removeDOMRenderFrame();
    }
}
export class ActionManager {
    constructor(parentController) {
        this.parentController = parentController;
        this.currentActionMode = this.draw_tiles;
        this.selectedTile = this.tileset.get("none");
        this.expansionAmount = 5;
        this.setupExpansionListeners();
    }
    get ident() { return this.parentController.ident; }
    get tileset() { return this.parentController.workingRenderer.tileset; }
    get grid() { return this.parentController.workingGrid; }
    get selector() { return this.parentController.workingSelector; }
    get renderer() { return this.parentController.workingRenderer; }
    get zoomManager() { return this.parentController.zoomManager; }
    get mouseManager() { return this.parentController.mouseManager; }
    get controllerMenu() { return this.parentController.controllerMenu; }
    get actionMode() {
        if (this.currentActionMode == this.select_deselect) {
            return "select";
        }
        else if (this.currentActionMode == this.draw_tiles) {
            return "draw";
        }
    }
    set actionMode(mode) {
        if (mode == "select") {
            this.currentActionMode = this.select_deselect;
        }
        else if (mode == "draw") {
            this.currentActionMode = this.draw_tiles;
        }
    }
    select_deselect([x, y]) {
        let selector = this.selector;
        if (selector.selection.hasCell([x, y])) {
            selector.deselect([x, y]);
        }
        else {
            selector.select([x, y]);
        }
        this.renderer.renderSelection(this.selector);
    }
    draw_tiles([x, y]) {
        let cell = this.grid.cell([x, y]);
        cell.data[`tile`] = this.selectedTile.name;
        console.log(cell);
        this.renderer.renderTile(cell);
    }
    drag_select([x1, y1], [x2, y2]) {
        this.selector.selectAreaBetween([x1, y1], [x2, y2]);
        this.renderer.renderSelection(this.selector);
    }
    draw_multiple(cells) {
        for (let i = 0; i < cells.length; i++) {
            let cell = cells[i];
            this.draw_tiles(cell);
        }
    }
    setupExpansionListeners() {
        let actionManager = this;
        document.getElementById('expand-top').addEventListener('mouseup', () => {
            actionManager.expandGrid('top');
        });
        document.getElementById('expand-right').addEventListener('mouseup', () => {
            actionManager.expandGrid('right');
        });
        document.getElementById('expand-bottom').addEventListener('mouseup', () => {
            actionManager.expandGrid('bottom');
        });
        document.getElementById('expand-left').addEventListener('mouseup', () => {
            actionManager.expandGrid('left');
        });
    }
    expandGrid(direction) {
        switch (direction) {
            case "top":
            case "bottom":
                this.grid.increaseHeight(this.expansionAmount, direction);
                break;
            case "left":
            case "right":
                this.grid.increaseWidth(this.expansionAmount, direction);
                break;
        }
        this.renderer.redoRender(this.grid);
        this.zoomManager.setZoom('grid-cell');
        this.mouseManager.setupListeners();
    }
    hideBorders() {
        removeClassFromAllMembers('grid-cell', 'default-cell-border');
    }
    showBorders() {
        addClassToAllMembers('grid-cell', 'default-cell-border');
    }
    /**
     * For tile to appear as selected in menu, this should be called through {@link ControllerMenu.selectTile()}
    */
    selectTile(tile) {
        this.selectedTile = tile;
    }
}
class KeyboardManager {
    constructor(parentController) {
        this.parentController = parentController;
    }
    get ident() { return this.parentController.ident; }
    get grid() { return this.parentController.workingGrid; }
    get zoomManager() { return this.parentController.zoomManager; }
    get controllerMenu() { return this.parentController.controllerMenu; }
    get actionManager() { return this.parentController.actionManager; }
    get selector() { return this.parentController.workingSelector; }
    get renderer() { return this.parentController.workingRenderer; }
    get actionMode() { return this.actionManager.actionMode; }
    zoomIn() {
        this.zoomManager.zoomIn();
    }
    zoomOut() {
        this.zoomManager.zoomOut();
    }
    rotateTileCCW() {
        this.controllerMenu.rotateSelectedTile('counterclockwise');
    }
    rotateTileCW() {
        this.controllerMenu.rotateSelectedTile('clockwise');
    }
    toggleSelectionMode() {
        if (this.actionMode == "select") {
            this.selector.clear();
            this.renderer.renderSelection(this.selector);
            this.actionManager.actionMode = "draw";
        }
        else if (this.actionMode == "draw") {
            this.actionManager.actionMode = "select";
        }
    }
    deleteSelectedTiles() {
        if (this.actionMode == "select") {
            this.selector.delete({ "tile": "none" });
        }
        this.selector.selection.forEachCell((cell) => {
            this.renderer.renderTile(cell);
        });
    }
    fillArea() {
        if (this.actionMode == "select") {
            this.selector._iterateOverSelection((params) => {
                let cell = params.currentCell;
                let [x, y] = cell.XYCoordinate;
                console.log(`cell xy at iteration: ${[x, y]}`);
                this.actionManager.draw_tiles([x, y]);
                this.renderer.renderTile(cell);
            });
        }
    }
    selectAll() {
        if (!(this.actionMode == "select")) {
            this.actionManager.actionMode = "select";
        }
        let bottom_left = [this.grid.left, this.grid.bottom];
        let top_right = [this.grid.right, this.grid.top];
        this.actionManager.drag_select(bottom_left, top_right);
    }
    setupListeners() {
        window.addEventListener('keyup', (event) => {
            let key = event.key;
            switch (key) {
                case '=':
                case '+':
                    this.zoomIn();
                    break;
                case '-':
                case '_':
                    this.zoomOut();
                    break;
                case 'q':
                    this.rotateTileCCW();
                    break;
                case 'w':
                    this.rotateTileCW();
                    break;
                case 'a':
                    this.selectAll();
                    break;
                case 'Shift':
                    this.toggleSelectionMode();
                    break;
                case "Backspace":
                    this.deleteSelectedTiles();
                    break;
                case "Enter":
                    this.fillArea();
                    break;
            }
        });
    }
}
class MouseManager {
    constructor(parentController) {
        this.mousePosition = new Stack();
        this.mousePosition["listening"] = false;
        this.parentController = parentController;
        this.cursor = document.getElementById('custom-cursor');
    }
    get ident() { return this.parentController.ident; }
    get actionManager() { return this.parentController.actionManager; }
    get keyboardManager() { return this.parentController.keyboardManager; }
    get selector() { return this.parentController.workingSelector; }
    get renderer() { return this.parentController.workingRenderer; }
    click() {
        console.log(this.mousePosition._stack);
        let [x, y] = this.mousePosition.latest;
        this.actionManager.currentActionMode([x, y]);
    }
    release() {
        console.log('release', this.mousePosition.latest, this.mousePosition.oldest);
        let actionMode = this.actionManager.currentActionMode;
        let select = this.actionManager.select_deselect;
        let draw = this.actionManager.draw_tiles;
        if (actionMode == select) {
            this.actionManager.drag_select(this.mousePosition.latest, this.mousePosition.oldest);
        }
        else if (actionMode == draw) {
            this.actionManager.draw_multiple(this.mousePosition._stack);
        }
    }
    hover() {
        let [x, y] = this.mousePositionCurrent;
        console.log('hover', this.mousePositionCurrent);
        getCellReference([x, y], this.ident).classList.add('hovered');
    }
    clearHover() {
        let [x, y] = this.mousePositionLast;
        console.log('clearhover', this.mousePositionLast);
        getCellReference([x, y], this.ident).classList.remove('hovered');
    }
    setupListeners() {
        const parentController = this.parentController;
        this.actionManager.grid.forEachCell((cell, grid, returnVariable) => {
            let [x, y] = cell.XYCoordinate;
            let reference = getCellReference([x, y], this.ident);
            reference.draggable = false;
            reference.addEventListener("pointerenter", () => {
                this.mousePositionCurrent = [x, y];
                this.hover();
                this.mousePosition.push([x, y]);
                if (!this.mousePosition['listening']) {
                    this.mousePosition.clear();
                    this.mousePosition.push([x, y]);
                }
            });
            reference.addEventListener("pointerleave", () => {
                this.mousePositionLast = [x, y];
                this.clearHover();
                if (!this.mousePosition['listening']) {
                    this.mousePosition.clear();
                }
            });
            reference.addEventListener("mousedown", (event) => {
                event.preventDefault();
                this.click();
                this.mousePosition['listening'] = true;
            });
            reference.addEventListener("mouseup", () => {
                this.mousePosition.push([x, y]);
                this.release();
                this.mousePosition['listening'] = false;
                this.mousePosition.clear();
                this.mousePosition.push([x, y]);
            });
            reference.addEventListener("dblclick", () => {
                activateDataEditor([x, y], cell.data, parentController);
            });
        });
    }
    setCursor(cursorType) {
    }
    appendCustomCursor() {
        document.addEventListener('mousemove', (event) => {
            this.cursor.style.top = `${event.pageY}px`;
            this.cursor.style.left = `${event.pageX}px`;
        });
    }
}
class ZoomManager {
    constructor(defaultZoom = 5, max = 20, min = 1) {
        this.zoomSize = 5;
        this.prevZoom = 5;
        this.maxZoom = 20;
        this.minZoom = 1;
        this.zoomSize = defaultZoom;
        this.prevZoom = defaultZoom;
        this.maxZoom = max;
        this.minZoom = min;
    }
    setDefaultZoom() {
        this.setZoom("grid-row");
        this.setZoom("grid-cell");
    }
    zoomIn() {
        console.log('zoomin');
        if (this.zoomSize != this.maxZoom) {
            this.zoomSize += 1;
            this.setZoom("grid-row");
            this.setZoom("grid-cell");
            this.prevZoom += 1;
        }
    }
    zoomOut() {
        console.log('zoomout');
        if (this.zoomSize != this.minZoom) {
            this.zoomSize -= 1;
            this.setZoom("grid-row");
            this.setZoom("grid-cell");
            this.prevZoom -= 1;
        }
    }
    /**
     * Iterates over all elements of a class and applies the appropriate size class.
    */
    setZoom(targetClass) {
        let zoomManager = this;
        let size = this.zoomSize;
        forEachInClass(targetClass, (elem) => {
            zoomManager.clearSizeClasses(elem);
            elem.classList.add(`grid-h-${size}`);
            if (!elem.classList.contains("grid-row")) {
                elem.classList.add(`grid-w-${size}`);
            }
        });
    }
    clearSizeClasses(element) {
        let height = `grid-h-${this.prevZoom}`;
        let width = `grid-w-${this.prevZoom}`;
        element.classList.remove(height);
        element.classList.remove(width);
    }
}
class ControllerMenu {
    constructor(menu, parentController) {
        this.menu = new DynamicElement(menu);
        this.parentController = parentController;
        let viewer = document.getElementById('selected-tile-viewer');
        if (viewer) {
            this.tileViewer = new DynamicElement(viewer);
        }
    }
    get renderer() { return this.parentController.workingRenderer; }
    get tileset() { return this.parentController.workingRenderer.tileset; }
    get mouseManager() { return this.parentController.mouseManager; }
    get actionManager() { return this.parentController.actionManager; }
    get keyboardManager() { return this.parentController.keyboardManager; }
    fillTileMenu(tileset, target) {
        let controllerMenu = this;
        let buttonsPlaced = [];
        tileset.forEachTile((tileName, tile, buttonsPlaced) => {
            let buttonPlaced = false;
            if (!buttonsPlaced.includes(tileName)) {
                if (tile.rotationGroup == undefined) {
                    controllerMenu.createTileSelectorButton(tileName, tile, target);
                    buttonPlaced = true;
                }
                else {
                    let rotationGroup = tileset.rotationGroups.get(tile.rotationGroup);
                    console.log(tile.rotationGroup);
                    tile = this.getRepresentativeTile(rotationGroup);
                    tileName = tile.name;
                    if (!buttonsPlaced.includes(tileName)) {
                        controllerMenu.createTileSelectorButton(tileName, tile, target);
                        buttonPlaced = true;
                    }
                }
            }
            if (buttonPlaced) {
                buttonsPlaced.push(tileName);
            }
            console.log(buttonsPlaced);
            return buttonsPlaced;
        }, buttonsPlaced);
    }
    clearTileMenu() {
        document.getElementById("tile-selector-frame").innerHTML = "";
    }
    getRepresentativeTile(rotationGroup) {
        let tilesInGroup = Array.from(rotationGroup.clockwise.keys());
        return tilesInGroup[0];
    }
    createTileSelectorButton(tileName, tile, target) {
        let menu = document.getElementById(target);
        let btn = document.createElement("button");
        let img = document.createElement("img");
        let controllerMenu = this;
        menu.appendChild(btn).id = `tile-selector-${tileName}`;
        let button = document.getElementById(`tile-selector-${tileName}`);
        button.classList.add("tile-selector-button");
        button.appendChild(img).src = tile.path;
        button.addEventListener('mouseup', () => {
            controllerMenu.selectTile(tile);
        });
    }
    /**
     * Selects a tile to be worked with and displays it as such.
    */
    selectTile(tile) {
        this.tileViewer.background = tile.path;
        this.actionManager.selectTile(tile);
    }
    rotateSelectedTile(direction) {
        let selectedTile = this.actionManager.selectedTile;
        let rotation = this.tileset.rotate(selectedTile, direction);
        this.selectTile(rotation);
    }
}
