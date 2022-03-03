import { Grid, Row } from "./grid.js";
import { readPositionDelta } from "./coordinate.js";
import { insertElementInMap } from "./map_helpers.js";
/**
 * Represents a set of cells in a Grid on which operations can be done.
 */
export class GridSelector {
    constructor(grid) {
        this.positionDelta = [0, 0];
        this.childGrid = grid;
        let emptyGridParams = {
            fillCells: false,
            fillRows: false
        };
        this.selection = new Grid(0, 0, emptyGridParams);
        this.clipboard = new Grid(0, 0, emptyGridParams);
    }
    /**
     * Sets the change in position desired for actions done on the selection.
     * In future, these initialXY and finalXY values will be provided by a mousedown
     * and mouseup event listener on the selected and destination tiles.
     * Deltas read from top-leftmost cell of selection.
     */
    setPositionDelta(initialXY, finalXY) {
        this.positionDelta = readPositionDelta(initialXY, finalXY);
    }
    /**
     * Executes a callback function at each element in the selection array. The callback function is given access to all local variables from iteration, in order: currentCell, destinationCell, returnVariable, deltaX, deltaY, i.
     * @param callback A function to execute at each element in the selection.
     * @param returnVariable Optional. A variable which can be modified by the callback function to pass back to the caller.
     * @returns Returns void if no returnVariable is given, or returns whatever is assigned to the returnVariable.
     */
    _iterateOverSelection(callback, returnVariable) {
        let [deltaX, deltaY] = this.positionDelta;
        this.selection.rows.forEach((currentRow, YPosition, selection) => {
            currentRow.columns.forEach((currentCell, XPosition, row) => {
                let [initialX, initialY] = [XPosition, YPosition];
                let [finalX, finalY] = [initialX + deltaX, initialY + deltaY];
                let destinationCell = this.childGrid.cell([finalX, finalY]);
                callback({
                    initialPosition: [initialX, initialY],
                    finalPosition: [finalX, finalY],
                    currentCell: currentCell,
                    destinationCell: destinationCell,
                });
            });
        });
        if (returnVariable != undefined) {
            return returnVariable;
        }
    }
    batchSelect(cells) {
        for (let i = 0; i < cells.length; i++) {
            this.select(cells[i]);
        }
    }
    /**
     * Adds the Cell at the given XY coordinate into the selection, if it exists.
     * @param XYCoordinate
     */
    select([cellX, cellY]) {
        let childCell = this.childGrid.cell([cellX, cellY]);
        if (this.childGrid.hasCell([cellX, cellY])) {
            if (this.selection.hasRow(cellY)) {
                this._selectInKnownRow([cellX, cellY], childCell);
            }
            else {
                this._selectInNewRow([cellX, cellY], childCell);
            }
        }
    }
    _selectInNewRow([cellX, cellY], childCell) {
        let newEmptyRow = new Row(0, cellY, this.selection, false);
        this.selection.rows = insertElementInMap(this.selection.rows, cellY, newEmptyRow);
        let newRow = this.selection.row(cellY);
        newRow.set(cellX, childCell);
    }
    _selectInKnownRow([cellX, cellY], childCell) {
        let knownRow = this.selection.row(cellY);
        if (knownRow.column(cellX) == undefined) {
            knownRow.columns = insertElementInMap(knownRow.columns, cellX, childCell);
        }
    }
    /**
     * Remove a cell from the current selection.
     */
    deselect([cellX, cellY]) {
        if (this.selection.hasRow(cellY)) {
            let row = this.selection.row(cellY);
            if (row.hasCell(cellX)) {
                row.columns.delete(cellX);
            }
        }
    }
    /**
     * Moves selected cells to desired location.
     * @see _iterateOverSelection
     */
    move(positionDelta) {
        this.positionDelta = positionDelta;
        this._iterateOverSelection((params) => {
            params.destinationCell.data = params.currentCell.data;
        });
        this.delete();
        this.shift(positionDelta);
    }
    /**
     * Switches selected cells with desired destination cells.
     * @see _iterateOverSelection
     */
    swap(positionDelta) {
        this.positionDelta = positionDelta;
        this._iterateOverSelection((params) => {
            [params.currentCell.data, params.destinationCell.data] = [params.destinationCell.data, params.currentCell.data];
        });
    }
    /**
     * Fills each cell in the selection with the given data.
     * @param data The data with which to fill each cell.
     * @see _iterateOverSelection
     */
    fill(data) {
        this._iterateOverSelection((currentCell) => {
            currentCell.data = data;
        });
    }
    /**
     * Creates a copy of the current selection into the clipboard to be used later.
     */
    copy() {
        this.clipboard = Object.assign({}, this.selection);
    }
    cut() {
        this.copy();
        this.clear();
    }
    /**
     * Places a duplicate of the selection copied into the location selected, relative to the top-leftmost tile in the selection.
     */
    paste(positionDelta) {
        this.positionDelta = positionDelta;
        this._iterateOverSelection((params) => {
        });
    }
    clearClipboard() {
        this.clipboard.rows.clear();
    }
    rotate(center, amount, clockwise) {
    }
    /**
     * Removes the data of each cell in the selection.
     * @see _iterateOverSelection
     */
    delete() {
        this._iterateOverSelection((params) => {
            params.currentCell.data = undefined;
        });
    }
    /**
     * Moves selection to desired destination.
     * @see _iterateOverSelection
     */
    shift(positionDelta) {
        this.positionDelta = positionDelta;
        let selectionDelta = {
            current: [],
            result: []
        };
        selectionDelta = this._iterateOverSelection((params) => {
            selectionDelta.current.push(params.initialPosition);
            selectionDelta.result.push(params.finalPosition);
        }, selectionDelta);
        this.clear();
        for (let i = 0; i < selectionDelta.result.length; i++) {
            let cell = selectionDelta.result[i];
            if (selectionDelta.current.includes(cell) == false) {
                this.select(cell);
            }
        }
    }
    /**
     * Clears the current selection.
     */
    clear() {
        this.selection.rows.clear();
    }
    /**
     * Exports the current selection to a JSON file to be rendered with a Grid renderer.
     */
    export() {
    }
    /**
     * The root cell is the cell which all actions on the selection are done relative to.
     * By default, the root is the top-leftmost cell in the selection, though this can be changed with the direction flag.
     * Top is prioritized; that is, even if a piece is further left than another, the higher one will be returned.
     * @see _iterateOverSelection
     */
    getRootCell(direction = "top-left") {
        let [vertical, horizontal] = direction.split('-');
        let YPosition = this.selection[vertical];
        let row = this.selection.row(YPosition);
        let XPosition = row[horizontal];
        let rootCell = row.column(XPosition);
        return rootCell;
    }
}
