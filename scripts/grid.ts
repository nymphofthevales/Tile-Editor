import { Coordinate, CoordinateAxis, generateCoordinateAxis, readPositionDelta } from "./coordinate.js"
import { parseMapKeysToArray, concatenateMaps, insertElementInMap } from "./map_helpers.js"
import { Direction, AdjacentDirection, QuantizedAngle, Directions, PerpendicularDirections } from "./direction.js"

export interface GridPreset {
    width: number,
    height: number,
    cells: Array<{
        position: Coordinate,
        data: any
    }>
}

interface CellData {
    [key: string]: any
}

/**
 * Sets up a data structure for an individual Cell in a Grid.
 */
export class Cell {
    parentRow: Row
    parentGrid: Grid
    XYCoordinate: Coordinate
    data: CellData = {}
    constructor(column: number, row: number, parentGrid: Grid, parentRow: Row) {
        this.XYCoordinate = [column,row]
        this.parentRow = parentRow
        this.parentGrid = parentGrid
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
    get adjacentCells(): object {
        let [x,y] = this.XYCoordinate
        let rowAbove = this.parentGrid.row(y + 1)
        let rowBelow = this.parentGrid.row(y - 1)
        return {
            'top' : rowAbove ? rowAbove.column(x) : undefined,
            'top-left': rowAbove ? rowAbove.column(x - 1) : undefined,
            'top-right': rowAbove ? rowAbove.column(x + 1) : undefined,
            'bottom' : rowBelow ? rowBelow.column(x) : undefined,
            'bottom-left': rowBelow ? rowBelow.column(x - 1) : undefined,
            'bottom-right': rowBelow ? rowBelow.column(x + 1) : undefined,
            'left' : this.parentRow.column(x - 1),
            'right': this.parentRow.column(x + 1)
        }
    }
}

/**
 * Sets up a data structure for a linear row of cells accessible by X-coordinate indices.
 * For a Row which is part of a larger Grid, Row size modification methods are not intended to be called directly but instead through it's parent Grid.
 */
export class Row {
    parentGrid: Grid
    columns: Map<number,Cell> = new Map();
    verticalPosition: number = 0
    constructor(width: number, verticalPosition: number, parentGrid: Grid, fillCells: boolean = true, from?: number) {
        this.parentGrid = parentGrid
        this.verticalPosition = verticalPosition;
        if (fillCells === true) {
            this.fillColumns(width,verticalPosition)
        }
    }
    get width(): number {
        return this.columns.size
    }
    get left(): number {
        return Math.min(...this.CurrentXAxis)
    }
    get right(): number {
        return Math.max(...this.CurrentXAxis)
    }
    get CurrentXAxis(): Array<number> {
        return parseMapKeysToArray(this.columns)
    }
    set(key: number, cell: Cell): void {
        this.columns.set(key, cell)
    }
    /**
     * @return Returns the Cell in the specified column.
     * @param XCoordinate 
     * @returns 
     */
    column(XCoordinate: number): Cell {
        return this.columns.get(XCoordinate)
    }
    hasCell(XCoordinate): boolean {
        return this.column(XCoordinate) != undefined
    }
    /**
     * Creates an object containing references to the row below and the row above, or undefined if there is none.
     * @param y 
     * @returns Returns a Direction keyed object.
     */
    adjacentRows(y = this.verticalPosition) {
        return {
            'top' : this.parentGrid.row(y + 1),
            'bottom' : this.parentGrid.row(y - 1)
        }
    }
    /**
     * Sets up basic structure of a Row filled with Cells. Each Cell corresponds to a column in 2D space.
     * @param width 
     * @param verticalPosition 
     */
    fillColumns(width: number,verticalPosition: number, from?: number): void {
        let XAxis = generateCoordinateAxis(width, from)
        for (let i = 0; i < XAxis.length; i++) {
            this.set( XAxis[i] , new Cell(XAxis[i], verticalPosition, this.parentGrid, this) )
        }
    }
    /**
     * Adds cells to one side of a Row. 
     * @param amount Number of cells to add.
     * @param to Direction string representing side of grid to which to add cells.
     */
    _expandRow(amount: number, to: Direction): void {
        //should not be called directly, but instead through its parent Grid.increaseWidth method.
        if (to === "right") {
            this._addCellsToRight(amount)
        } else if (to === "left") {
            this._addCellsToLeft(amount)
        } else {
            throw new Error('Invalid direction.')
        }
    }

    _addCellsToRight(amount: number) {
        //positive x values
        let rightmostPosition = this.right + 1
        for (let i = 0; i < amount; i++) {
            this.set(rightmostPosition,new Cell(rightmostPosition,this.verticalPosition, this.parentGrid, this))
            rightmostPosition++
        }
    }
    _addCellsToLeft(amount: number) {
        //negative x values
        let leftmostPosition = this.left - amount
        let oldMapCopy = new Map(this.columns)
        this.columns.clear()
        for (let i = 0; i < amount; i++) {
            this.set(leftmostPosition,new Cell(leftmostPosition,this.verticalPosition, this.parentGrid, this))
            leftmostPosition++
        }
        this.columns = concatenateMaps(oldMapCopy,this.columns)
    }
    _shortenRow(amount: number, from: Direction): void {
        //should not be called directly, but instead through its parent Grid.reduceWidth method.
        if (amount > this.width) {
            throw new Error('Cannot shorten row width below 0.')
        } else if (from === 'left') {
            for (let i = 0; i < amount; i++) {
                this.columns.delete(this.left)
            }
        } else if (from === 'right') {
            for (let i = 0; i < amount; i++) {
                this.columns.delete(this.right)
            }
        }
    }
    /**
     * Runs a callback function over every cell in the row.
     * @see Grid.forEachCell
    */
    forEachCell(callback: Function, returnVariable?: any): void | any {
        for (const [XPosition, cell] of this.columns) {
            if (returnVariable != undefined) {
                returnVariable = callback(cell, this.parentGrid, returnVariable)
            } else {
                callback(cell, this.parentGrid, returnVariable)
            }
        }
        if (returnVariable != undefined) {
            return returnVariable
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
    rows: Map<number,Row> = new Map();
    constructor(width: number = 1, height: number = 1,  opts?: {
        fillRows?: boolean, 
        fillCells?: boolean
    }) {
        let fillRows = opts?.fillRows? opts.fillRows : true
        let fillCells = opts?.fillCells? opts.fillCells : true
        let YAxis = generateCoordinateAxis(height)
        if (fillRows) {
            this.fillRows(width, YAxis, fillCells)
        }
    }
    /**
     * The width of the Grid, read from the bottommost row.
    */
    get width(): number {
        return this.rows.get(this.bottom).width
    }
    /**
     * The height of the Grid, read from the number of rows.
    */
    get height(): number {
        return this.rows.size
    }
    /**
     * The index of the bottommost row, computed from the row keys.
    */
    get bottom(): number {
        return Math.min(...this.CurrentYAxis)
    }
    /**
     * The index of the topmost row, computed from the row keys.
    */
    get top(): number {
        return Math.max(...this.CurrentYAxis)
    }
    /**
     * The index of the leftmost column, read from the cells in the bottommost row.
    */
    get left(): number {
        return this.rows.get(this.bottom).left
    }
    /**
     * The index of the rightmost column, read from the cells in the bottommost row.
    */
    get right(): number {
        return this.rows.get(this.bottom).right
    }
    /**
     * The Y Axis of the grid in its present state, read from the row keys.
    */
    get CurrentYAxis(): Array<number> {
        return parseMapKeysToArray(this.rows)
    }
    get CurrentXAxis(): Array<number> {
        return this.row(this.bottom).CurrentXAxis
    }
    /**
     * Insert a row into the grid. Since the Grid.rows is an ordered map, this only appends one to the bottom, so may destroy coordinate order. To expand the grid, use {@link Grid.increaseWidth} and {@link Grid.increaseHeight}.
     */
    set(key: number, row: Row): void {
        this.rows.set(key, row)
    }
    /**
     * Get the Row at the specified coordinate.
     * @param YCoordinate a number that exists within the 
     */
    row(YCoordinate: number): Row {
        return this.rows.get(YCoordinate)
    }
    /**
     * @returns Returns the Cell at the specified Coordinates in the Grid.
     */
     cell([x,y]: Coordinate): Cell {
        return this.row(y)?.column(x) 
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
    forEachCell(callback: Function, returnVariable?: any): void | any {
        for (const [YPosition, row] of this.rows) {
            for (const [XPosition, cell] of row.columns) {
                if (returnVariable != undefined) {
                    returnVariable = callback(cell, this, returnVariable)
                } else {
                    callback(cell, this, returnVariable)
                }
            }
        }
        if (returnVariable != undefined) {
            return returnVariable
        }
    }
    forEachCellInRow(YCoordinate: number, callback: Function, returnVariable?: any): void | any {
        return this.row(YCoordinate)?.forEachCell(callback, returnVariable)
    }
    forEachCellInColumn(XCoordinate: number, callback: Function, returnVariable?: any): void | any {
        if (this.row(this.bottom).hasCell(XCoordinate)) {
            for (let y=this.bottom; y <= this.top; y++) {
                let cell = this.row(y).column(XCoordinate)
                if (returnVariable != undefined) {
                    returnVariable = callback(cell, this, returnVariable)
                } else {
                    callback(cell, this, returnVariable)
                }
            }
            if (returnVariable != undefined) {
                return returnVariable
            }
        }
    }
    /**
     * Check whether the grid contains a row at the given YCoordinate.
    */
    hasRow(YCoordinate: number): boolean {
        return this.row(YCoordinate) != undefined
    }
    /**
     * Check whether the grid contains a cell at the given [x,y]. Can only be true if a row at that Y also exists.
    */
    hasCell([cellX, cellY]: Coordinate): boolean {
        if (this.hasRow(cellY)) {
            return this.row(cellY).hasCell(cellX)
        } else {
            return false
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
    fillRows(width: number,YAxis: CoordinateAxis, fillCells: boolean = true) {
        for (let i = 0; i < YAxis.length; i++) {
            this.set( YAxis[i] , new Row(width,YAxis[i], this, fillCells) )
        }
    }
    /**
     * Expands the size of the grid vertically.
    */
    increaseHeight(amount: number, to: Direction): void  {
        let YAxis = this.CurrentYAxis
        if (to === 'bottom') {
            //negative y values
            this._addRowsToBottom(amount,YAxis)
        } else if (to === 'top') {
            //positive y values
            this._addRowsToTop(amount,YAxis)
        }
    }
    _addRowsToTop(amount: number,YAxis: CoordinateAxis): void {
        //continues after most recent elements in map; no change in order necessary
        let verticalPosition = this.top + 1
        for (let i = 0; i < amount; i++) {
            this.set(verticalPosition, new Row(this.width,verticalPosition, this))
            verticalPosition++
        }
    }
    _addRowsToBottom(amount: number,YAxis: CoordinateAxis): void {
        //needs to add to the beginning of the map; reassignment of order necessary
        let verticalPosition = this.bottom - amount
        let left = this.left
        let oldMapCopy = new Map(this.rows)
        let width = this.width
        this.rows.clear()
        for (let i = 0; i < amount; i++) {
            this.set(verticalPosition,new Row(width,verticalPosition, this, true, left))
            verticalPosition++
        }
        this.rows = concatenateMaps(oldMapCopy,this.rows)
    }
    reduceHeight(amount: number, from: Direction): void  {
        if (amount > this.height) {
            throw new Error(`Cannot remove more rows than exist on Grid.`)
        } else if (from === 'bottom') {
            for (let i = 0; i < amount; i++) {
                this.rows.delete(this.bottom)
            }
        } else if (from === 'top') {
            for (let i = 0; i < amount; i++) {
                this.rows.delete(this.top)
            }
        }
    }
    increaseWidth(amount: number, to: Direction): void  {
        // adds given number
        this.rows.forEach((row) => {
            row._expandRow(amount,to)
        })
    }
    reduceWidth(amount: number, from: Direction): void  {
        // removes given number of cells from given side of every row in the Grid.
        this.rows.forEach((row) => {
            row._shortenRow(amount,from)
        })
    }
    reduceSize(amount: number, from: Direction) {
        switch (from) {
            case "top":
            case "bottom":
                this.reduceHeight(amount, from);
                break;
            case "left":
            case "right":
                this.reduceWidth(amount, from);
                break;
        }
    }
    increaseSize(amount: number, to: Direction) {
        switch(to) {
            case "top":
            case "bottom":
                this.increaseHeight(amount, to);
                break;
            case "left":
            case "right":
                this.increaseWidth(amount, to);
                break;
        }
    }
    /**
     * Recursively removes rows and columns from the grid from each direction until it reaches a column or row that has data in at least one of the cells. 
     * @param dataEvaluator is a user-defined callback used to check whether a cell's data can be considered empty. Should return true if the cell data passed to it is empty and the cell should be removed, and false if the cell should be kept.
     * @param direction is used for recursive functionality and should not be set.
     * @param done is an iteration counter for recursion and should not be set.
    */
    cropGrid(dataEvaluator: Function = (data) => {return Object.keys(data).length == 0}, direction: Direction = "top", iterations: number = 1): void {
        //console.log(`currentXAxis: ${JSON.stringify(this.CurrentXAxis)}`)
        //console.log(`currentYAxis: ${JSON.stringify(this.CurrentYAxis)}`)
        let hasData = 0
        let index = this[direction]
        let callback = (cell, grid, hasData) => {
            let isEmpty = dataEvaluator(cell.data)
            //console.log(`${isEmpty} ${grid.width} ${grid.height} ${hasData}`)
            if (!isEmpty) {
                return hasData + 1
            }
            return 0
        }
        switch (direction) {
            case "top":
            case "bottom":
                if (this.height > 1) {
                    hasData = this.forEachCellInRow(index, callback, hasData)
                } else {
                    hasData = 1
                }
                break;
            case "left":
            case "right":
                if (this.width > 1) {
                    hasData = this.forEachCellInColumn(index, callback, hasData)
                } else {
                    hasData = 1
                }
                break;
        }
        if (hasData == 0) {
            this.reduceSize(1, direction)
            this.cropGrid(dataEvaluator, direction, iterations)
        } else if (PerpendicularDirections[iterations] != undefined) {
            //console.log(PerpendicularDirections[iterations])
            this.cropGrid(dataEvaluator, PerpendicularDirections[iterations], iterations + 1)
        }
    }
}

export function generateGridFromPreset(preset: GridPreset): Grid {
    let presetGrid = new Grid(preset.width, preset.height)
    preset.cells.forEach((presetCell, index, array) => {
        presetGrid.cell(presetCell.position).data = presetCell.data
    })
    return presetGrid
}

let preset = {
    "width": 0,
    "height": 0,
    "cells": [
        {
            "position": [0,0],
            "data": {
                "direction": "left-up-down-right",
                "type": "tile"
            }
        },
        {
            "position": [1,1],
            "data": {
                "direction": "left-right",
                "type": "node",
                "unlocked": true,
                "pageObjects": ["castRunes", "readRunes"]
            }
        },
    ]
}