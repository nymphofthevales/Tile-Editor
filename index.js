import { PerpendicularDirections } from "./Direction.js";
import { getUniqueIdentifier } from "./numerical_helpers.js";
import { Grid, generateGridFromPreset } from "./Grid.js";
/**
 * Sets up a renderer for a grid,
 * capable of creating or modifying html elements on the fly to reflect changes in the data.
 */
class GridRenderer {
    constructor(target = document.body, tileset) {
        this.styles = {
            grid: {
                BGColor: 'palegoldenrod',
                borderDefault: '1px dotted lightseagreen'
            },
            selection: {
                BGColor: 'inherit',
                borderEdge: '2px solid lightseagreen'
            }
        };
        this.identifier = getUniqueIdentifier().toString();
        this.tileset = tileset ? tileset : undefined;
        this.createFrame(target);
    }
    createFrame(targetElement) {
        if (document.getElementById("Grid_Renderer_Frame" + this.identifier) == null) {
            let div = document.createElement("div");
            targetElement.appendChild(div).id = "Grid_Renderer_Frame_" + this.identifier;
            this.frame = document.getElementById('Grid_Renderer_Frame_' + this.identifier);
            this.frame.classList.add('grid-renderer-frame');
        }
    }
    staticRenderPreset(preset) {
        let grid = generateGridFromPreset(preset);
        this.staticRender(grid);
    }
    staticRender(grid) {
    }
    dynamicRender(grid, gridSelector) {
        this.resolveData_DocumentDeltas(grid);
        this.renderSelection(gridSelector);
    }
    renderSelection(selector) {
        let grid = selector.childGrid;
        selector._iterateOverSelection((opts) => {
            this.renderCellSelection(grid, opts.initialPosition);
        });
    }
    renderCellSelection(grid, [cellX, cellY]) {
        let currentCell = grid.cell([cellX, cellY]);
        let HTMLCellReference = getCellReference([cellX, cellY], this.identifier);
        HTMLCellReference.classList.add('selected');
        this.renderAdjacentCellBorders(grid, currentCell, HTMLCellReference);
    }
    renderAdjacentCellBorders(grid, currentCell, HTMLCellReference) {
        let selector = grid.boundSelector;
        let adjacencies = currentCell.adjacentCells;
        for (let i = 0; i < PerpendicularDirections.length; i++) {
            let direction = PerpendicularDirections[i];
            let adjacentCell = adjacencies[direction];
            let border = HTMLCellReference.style;
            if (adjacentCell != undefined) {
                if (selector.selection.hasCell(adjacentCell.XYCoordinate) == false) {
                    border['border-' + direction] = this.styles.selection.borderEdge;
                }
                else {
                    border['border-' + direction] = this.styles.grid.borderDefault;
                }
            }
            else {
                border['border-' + direction] = this.styles.selection.borderEdge;
            }
        }
    }
    /**
     * Takes in a user-defined callback function for extracting tileset keys from cell data.
    */
    renderTileset(grid, callback) {
        let sum = 0;
        sum = grid.forEach(() => {
            sum += 1;
        }, sum);
        console.log(sum);
        let all = [];
        all = grid.forEach((cell) => {
            all.push(cell.XYCoordinate);
        }, all);
        console.log(all);
        let HTMLCellReference = getCellReference([0, 0], grid.identifier);
    }
    /**
     * Resets grid to be totally deselected. Definitely the most inefficient way to do this. Runs in On^2 time.
     */
    removeSelection(grid) {
        grid.rows.forEach((row, YPosition, grid) => {
            row.columns.forEach((column, XPosition) => {
                this.deselectCell([XPosition, YPosition]);
            });
        });
    }
    deselectCell([cellX, cellY]) {
        let HTMLCellReference = getCellReference([cellX, cellY], this.identifier);
        HTMLCellReference.classList.remove('selected');
        this.removeCellBorders([cellX, cellY], HTMLCellReference);
    }
    removeCellBorders([cellX, cellY], HTMLCellReference) {
        for (let i = 0; i < PerpendicularDirections.length; i++) {
            let direction = PerpendicularDirections[i];
            HTMLCellReference.style['border-' + direction] = this.styles.grid.borderDefault;
        }
    }
    resolveData_DocumentDeltas(grid) {
        this.checkRowsInDocument(grid);
        this.checkCellsInDocument(grid);
        this.checkRowsInGrid(grid);
    }
    checkRowsInGrid(grid) {
        grid.rows.forEach((row, YPosition) => {
            if (documentHasRow(YPosition, this.identifier)) {
                this.checkCellsInRowInGrid(row, YPosition);
            }
            else {
                this.addRowToDocument(row, YPosition);
            }
        });
    }
    checkCellsInRowInGrid(row, YPosition) {
        row.columns.forEach((column, XPosition, grid) => {
            if (!documentHasCell([XPosition, YPosition], this.identifier)) {
                this.addCellToDocument([XPosition, YPosition]);
            }
        });
    }
    checkRowsInDocument(grid) {
        let rows = document.getElementsByClassName('grid-row-in-' + this.identifier);
        let removalQueue = [];
        for (let i = 0; i < rows.length; i++) {
            let row = rows.item(i);
            let id = row.id;
            let index = parseInt(id.split(' ')[1]);
            if (grid.hasRow(index) == false) {
                removalQueue.push(row);
            }
        }
        this.fulfillRowRemovalQueue(removalQueue);
    }
    checkCellsInDocument(grid) {
        let cells = document.getElementsByClassName('grid-cell-in-' + this.identifier);
        let removalQueue = [];
        for (let i = 0; i < cells.length; i++) {
            let cell = cells.item(i);
            let id = cell.id;
            let [itemName, XString, YString] = id.split(' ');
            let [XPosition, YPosition] = [parseInt(XString), parseInt(YString)];
            if (grid.hasCell([XPosition, YPosition]) == false) {
                removalQueue.push([cell, YPosition]);
            }
        }
        this.fulfillCellRemovalQueue(removalQueue);
    }
    addRowToDocument(row, YPosition) {
        let HTMLRow = document.createElement("div");
        this.frame.appendChild(HTMLRow).id = `row ${YPosition}` + ' ' + this.identifier;
        let HTMLRowReference = getRowReference(YPosition, this.identifier);
        HTMLRowReference.classList.add('grid-row');
        HTMLRowReference.classList.add('grid-row-in-' + this.identifier);
        HTMLRowReference.style.order = `${YPosition}`;
        row.columns.forEach((column, XPosition, row) => {
            if (!documentHasCell([XPosition, YPosition], this.identifier)) {
                this.addCellToDocument([XPosition, YPosition]);
            }
        });
    }
    addCellToDocument([XPosition, YPosition]) {
        let div = document.createElement("div");
        let HTMLRowReference = getRowReference(YPosition, this.identifier);
        HTMLRowReference.appendChild(div).id = `cell ${XPosition} ${YPosition}` + ' ' + this.identifier;
        let HTMLCellReference = getCellReference([XPosition, YPosition], this.identifier);
        HTMLCellReference.classList.add('grid-cell');
        HTMLCellReference.classList.add('grid-cell-in-' + this.identifier);
        HTMLCellReference.style.order = `${XPosition}`;
    }
    fulfillRowRemovalQueue(removalQueue) {
        for (let i = 0; i < removalQueue.length; i++) {
            let row = removalQueue[i];
            this.removeRowFromDocument(row);
        }
    }
    fulfillCellRemovalQueue(removalQueue) {
        for (let i = 0; i < removalQueue.length; i++) {
            let cell = removalQueue[i][0];
            let YPosition = removalQueue[i][1];
            this.removeCellFromDocument(cell, YPosition);
        }
    }
    removeRowFromDocument(row) {
        this.frame.removeChild(row);
    }
    removeCellFromDocument(cell, YPosition) {
        let row = getRowReference(YPosition, this.identifier);
        row.removeChild(cell);
    }
}
class GridController {
    constructor(boundRenderer) {
        this.boundRenderer = boundRenderer;
    }
    setupListeners() {
        this.setupButtonListeners();
    }
    setupButtonListeners() {
    }
    setupKeyboardListeners() {
    }
    setupMouseListeners() {
    }
    appendCustomCursors() {
    }
}
function getRowReference(y, identifier) {
    return document.getElementById(`row ${y}` + ' ' + identifier);
}
function getCellReference([x, y], identifier) {
    return document.getElementById(`cell ${x} ${y}` + ' ' + identifier);
}
function documentHasCell([x, y], identifier) {
    return getCellReference([x, y], identifier) != null;
}
function documentHasRow(y, identifier) {
    return getRowReference(y, identifier) != null;
}
function setupTestGrid() {
    let testGrid = new Grid(15, 15, {});
    testGrid.boundSelector.batchSelect([
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 2],
        [1, 2],
        [3, 2],
        [-1, 2],
        [-2, -1],
        [4, 4],
        [4, 3],
        [4, 2]
    ]);
    return testGrid;
}
function testShiftSelection([deltaX, deltaY], testGrid) {
    testGrid.boundSelector.shift([deltaX, deltaY]);
    testGrid.boundRenderer.removeSelection();
    testGrid.boundRenderer.renderSelection();
}
let testGrid = setupTestGrid();
let r = new GridRenderer();
r.dynamicRender(testGrid, testGrid.boundSelector);
r.renderTileset(testGrid, () => { });
