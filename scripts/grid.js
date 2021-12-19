import { generateCoordinateAxis, readPositionDelta } from "./Coordinate.js";
import { parseMapKeysToArray, concatenateMaps, insertElementInMap } from "./map_helpers.js";
import { getUniqueIdentifier } from "./numerical_helpers.js";
/**
 * Sets up a data structure for an individual Cell in a Grid.
 */
export class Cell {
    constructor(column, row, parentGrid, parentRow) {
        this.data = undefined;
        this.XYCoordinate = [column, row];
        this.parentRow = parentRow;
        this.parentGrid = parentGrid;
    }
    /**
     * Creates an object containing references to any adjacent cells, or undefined if there is none in that position.
     * Includes diagonally adjacent cells, keyed by AdjacentDirection strings.
     * @example
     * let adjacent = fooCell.adjacentCells
     * cellAbove = adjacent.top
     * cellTopLeft = adjacent.topleft
     * @returns Returns a Direction and AdjacentDirection keyed object.
     * @see Direction
     * @see AdjacentDirection
    */
    get adjacentCells() {
        let [x, y] = this.XYCoordinate;
        let rowAbove = this.parentGrid.row(y + 1);
        let rowBelow = this.parentGrid.row(y - 1);
        return {
            'top': rowAbove ? rowAbove.column(x) : undefined,
            'top-left': rowAbove ? rowAbove.column(x - 1) : undefined,
            'top-right': rowAbove ? rowAbove.column(x + 1) : undefined,
            'bottom': rowBelow ? rowBelow.column(x) : undefined,
            'bottom-left': rowBelow ? rowBelow.column(x - 1) : undefined,
            'bottom-right': rowBelow ? rowBelow.column(x + 1) : undefined,
            'left': this.parentRow.column(x - 1),
            'right': this.parentRow.column(x + 1)
        };
    }
}
/**
 * Sets up a data structure for a linear row of cells accessible by X-coordinate indices.
 * For a Row which is part of a larger Grid, Row size modification methods are not intended to be called directly but instead through it's parent Grid.
 */
export class Row {
    constructor(width, verticalPosition, parentGrid, fillCells = true) {
        this.columns = new Map();
        this.verticalPosition = 0;
        this.parentGrid = parentGrid;
        this.verticalPosition = verticalPosition;
        if (fillCells === true) {
            this.fillColumns(width, verticalPosition);
        }
    }
    get width() {
        return this.columns.size;
    }
    get left() {
        return Math.min(...this.CurrentXAxis);
    }
    get right() {
        return Math.max(...this.CurrentXAxis);
    }
    get CurrentXAxis() {
        return parseMapKeysToArray(this.columns);
    }
    set(key, cell) {
        this.columns.set(key, cell);
    }
    /**
     * @return Returns the Cell in the specified column.
     * @param XCoordinate
     * @returns
     */
    column(XCoordinate) {
        return this.columns.get(XCoordinate);
    }
    hasCell(XCoordinate) {
        return this.column(XCoordinate) != undefined;
    }
    /**
     * Creates an object containing references to the row below and the row above, or undefined if there is none.
     * @param y
     * @returns Returns a Direction keyed object.
     */
    adjacentRows(y = this.verticalPosition) {
        return {
            'top': this.parentGrid.row(y + 1),
            'bottom': this.parentGrid.row(y - 1)
        };
    }
    /**
     * Sets up basic structure of a Row filled with Cells. Each Cell corresponds to a column in 2D space.
     * @param width
     * @param verticalPosition
     */
    fillColumns(width, verticalPosition) {
        let XAxis = generateCoordinateAxis(width);
        for (let i = 0; i < XAxis.length; i++) {
            this.set(XAxis[i], new Cell(XAxis[i], verticalPosition, this.parentGrid, this));
        }
    }
    /**
     * Adds cells to one side of a Row.
     * @param amount Number of cells to add.
     * @param to Direction string representing side of grid to which to add cells.
     */
    _expandRow(amount, to) {
        //should not be called directly, but instead through its parent Grid.increaseWidth method.
        if (to === "right") {
            this._addCellsToRight(amount);
        }
        else if (to === "left") {
            this._addCellsToLeft(amount);
        }
        else {
            throw new Error('Invalid direction.');
        }
    }
    _addCellsToRight(amount) {
        //positive x values
        let rightmostPosition = this.right + 1;
        for (let i = 0; i < amount; i++) {
            this.set(rightmostPosition, new Cell(rightmostPosition, this.verticalPosition, this.parentGrid, this));
            rightmostPosition++;
        }
    }
    _addCellsToLeft(amount) {
        //negative x values
        let leftmostPosition = this.left - amount;
        let oldMapCopy = new Map(this.columns);
        this.columns.clear();
        for (let i = 0; i < amount; i++) {
            this.set(leftmostPosition, new Cell(leftmostPosition, this.verticalPosition, this.parentGrid, this));
            leftmostPosition++;
        }
        this.columns = concatenateMaps(oldMapCopy, this.columns);
    }
    _shortenRow(amount, from) {
        //should not be called directly, but instead through its parent Grid.reduceWidth method.
        if (amount > this.width) {
            throw new Error('Cannot shorten row width below 0.');
        }
        else if (from === 'left') {
            for (let i = 0; i < amount; i++) {
                this.columns.delete(this.left);
            }
        }
        else if (from === 'right') {
            for (let i = 0; i < amount; i++) {
                this.columns.delete(this.right);
            }
        }
    }
}
/**
 * Sets up a data structure to represent a two-dimensional plane with Rows of Cells.
 * Rows lie along the Y-axis and are able to be indexed by positive and negative coordinates.
 * Provides two ways of accessing individual cells: through row, and by coordinate pair.
 * @example
 * testGrid = new Grid(10,10)
 * testGrid.row(-1)
 * // Returns Row at YCoordinate -1.
 * testGrid.row(-1).column(2)
 * // Returns Cell at XYCoordinate (2,-1)
 * testGrid.cell([2,-1])
 * // Returns Cell at XYCoordinate (2,-1)
 */
export class Grid {
    constructor(width = 1, height = 1, { fillRows = true, fillCells = true, boundSelector = true, }) {
        this.rows = new Map();
        this.identifier = getUniqueIdentifier().toString();
        let YAxis = generateCoordinateAxis(height);
        if (fillRows) {
            this.fillRows(width, YAxis, fillCells);
        }
        if (boundSelector) {
            this.boundSelector = new GridSelector(this);
        }
    }
    get width() {
        return this.rows.get(this.bottom).width;
    }
    get height() {
        return this.rows.size;
    }
    get bottom() {
        return Math.min(...this.CurrentYAxis);
    }
    get top() {
        return Math.max(...this.CurrentYAxis);
    }
    get CurrentYAxis() {
        return parseMapKeysToArray(this.rows);
    }
    /**
     *
     */
    set(key, row) {
        this.rows.set(key, row);
    }
    /**
     * Get the Row at the specified coordinate.
     * @param YCoordinate a number that exists within the
     */
    row(YCoordinate) {
        return this.rows.get(YCoordinate);
    }
    /**
     * @returns Returns the Cell at the specified Coordinates in the Grid.
     */
    cell([x, y]) {
        let cell;
        cell = this.hasRow(y) ? this.row(y).column(x) : undefined;
        return cell;
    }
    forEach(callback, returnVariable) {
        this.rows.forEach((row, YPosition, grid) => {
            row.columns.forEach((cell, XPosition, grid) => {
                callback(cell, grid, returnVariable);
            });
        });
        if (returnVariable != undefined) {
            return returnVariable;
        }
    }
    hasRow(YCoordinate) {
        return this.row(YCoordinate) != undefined;
    }
    hasCell([cellX, cellY]) {
        if (this.hasRow(cellY)) {
            return this.row(cellY).hasCell(cellX);
        }
        else {
            return false;
        }
    }
    /**
     * Sets up the basic structure of a 2D Grid as a map of rows accessible by Y-axis coordinates centered at an origin.
     * @param YAxis An axis generated by generateCoordinateAxis().
     * @param width The desired width of the grid.
     * @see generateCoordinateAxis
     * @see Row
     * @see Row.fillColumns
     */
    fillRows(width, YAxis, fillCells = true) {
        for (let i = 0; i < YAxis.length; i++) {
            this.set(YAxis[i], new Row(width, YAxis[i], this, fillCells));
        }
    }
    increaseHeight(amount, to) {
        let YAxis = this.CurrentYAxis;
        if (to === 'bottom') {
            //negative y values
            this._addRowsToBottom(amount, YAxis);
        }
        else if (to === 'top') {
            //positive y values
            this._addRowsToTop(amount, YAxis);
        }
    }
    _addRowsToTop(amount, YAxis) {
        //continues after most recent elements in map; no change in order necessary
        let verticalPosition = this.top + 1;
        for (let i = 0; i < amount; i++) {
            this.set(verticalPosition, new Row(this.width, verticalPosition, this));
            verticalPosition++;
        }
    }
    _addRowsToBottom(amount, YAxis) {
        //needs to add to the beginning of the map; reassignment of order necessary
        let verticalPosition = this.bottom - amount;
        let oldMapCopy = new Map(this.rows);
        let width = this.width;
        this.rows.clear();
        for (let i = 0; i < amount; i++) {
            this.set(verticalPosition, new Row(width, verticalPosition, this));
            verticalPosition++;
        }
        this.rows = concatenateMaps(oldMapCopy, this.rows);
    }
    reduceHeight(amount, from) {
        if (amount > this.height) {
            throw new Error(`Cannot remove more rows than exist on Grid.`);
        }
        else if (from === 'bottom') {
            for (let i = 0; i < amount; i++) {
                this.rows.delete(this.bottom);
            }
        }
        else if (from === 'top') {
            for (let i = 0; i < amount; i++) {
                this.rows.delete(this.top);
            }
        }
    }
    increaseWidth(amount, to) {
        // adds given number
        this.rows.forEach((row) => {
            row._expandRow(amount, to);
        });
    }
    reduceWidth(amount, from) {
        // removes given number of tiles from given side of every row in the Grid.
        this.rows.forEach((row) => {
            row._shortenRow(amount, from);
        });
    }
}
/**
 * Represents a set of cells in a Grid on which operations can be done.
 */
export class GridSelector {
    constructor(grid) {
        this.positionDelta = [0, 0];
        this.childGrid = grid;
        this.identifier = grid.identifier;
        let emptyGridParams = {
            fillCells: false,
            fillRows: false,
            boundSelector: false
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
/**
 * Performs strangely for even-dimensional grids. Data will still be in their proper cells,
 * but if a grid of width
 */
export function generateGridFromPreset(preset) {
    let presetGrid = new Grid(preset.width, preset.height, {});
    preset.cells.forEach((presetCell, index, array) => {
        presetGrid.cell(presetCell.position).data = presetCell.data;
    });
    return presetGrid;
}
let preset = {
    "width": 0,
    "height": 0,
    "cells": [
        {
            "position": [0, 0],
            "data": {
                "direction": "left-up-down-right",
                "type": "tile"
            }
        },
        {
            "position": [1, 1],
            "data": {
                "direction": "left-right",
                "type": "node",
                "unlocked": true,
                "pageObjects": ["castRunes", "readRunes"]
            }
        },
    ]
};
