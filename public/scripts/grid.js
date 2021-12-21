import { generateCoordinateAxis } from "./coordinate.js";
import { parseMapKeysToArray, concatenateMaps } from "./map_helpers.js";
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
    constructor(width = 1, height = 1, opts) {
        this.rows = new Map();
        let fillRows = (opts === null || opts === void 0 ? void 0 : opts.fillRows) ? opts.fillRows : true;
        let fillCells = (opts === null || opts === void 0 ? void 0 : opts.fillCells) ? opts.fillCells : true;
        this.identifier = getUniqueIdentifier().toString();
        let YAxis = generateCoordinateAxis(height);
        if (fillRows) {
            this.fillRows(width, YAxis, fillCells);
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
    /**
     * Allows iteration over all the cells in a grid.
     * @param returnVariable a variable to hold values produced from the
     * action done on each cell. If not undefined, forEachCell returns whatever
     * is assigned to it in the callback.
     * @param callback a function to run on each cell in the grid.
     * Callback function will be passed three parameters:
     * @param cell a reference to the current cell.
     * @param grid a reference to the parent grid.
     * @param returnVariable the given returnVariable if it has been specified.
     * If a returnVariable is desired, the callback should modify it and
     * return something to assign to it at each step.
     * @example
     * let grid = new Grid(5,5)
     * let sum = 0
        sum = grid.forEachCell((cell, grid, sum) => {
            sum += 1
            return sum
        }, sum)
        // sum should equal 25
     * @example
        let grid = new Grid(3,3)
        let cells = []
        cells = grid.forEachCell((cell, grid, cells) => {
            cells.push(cell.XYCoordinate)
            return cells
        }, cells)
        // cells should hold the coordinates of each cell in the grid.
        // cells = [[-1,-1], [0,-1], [1,-1], [-1,0], [0,0], [1,0], [-1,1], [0,1], [1,1]]
     */
    forEachCell(callback, returnVariable) {
        for (const [YPosition, row] of this.rows) {
            for (const [XPosition, cell] of row.columns) {
                if (returnVariable != undefined) {
                    returnVariable = callback(cell, this, returnVariable);
                }
                else {
                    callback(cell, this, returnVariable);
                }
            }
        }
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
 * Performs strangely for even-dimensional grids. Data will still be in their proper cells,
 * but if a grid of width
 */
export function generateGridFromPreset(preset) {
    let presetGrid = new Grid(preset.width, preset.height);
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
