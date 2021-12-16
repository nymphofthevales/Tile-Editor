import { Coordinate, CoordinateAxis, generateCoordinateAxis, readPositionDelta } from "./Coordinate"
import { parseMapKeysToArray, concatenateMaps, insertElementInMap } from "./map_helpers"
import { Direction, AdjacentDirection, QuantizedAngle } from "./Direction"
import { getUniqueIdentifier } from "./numerical_helpers" 

/**
 * Sets up a data structure for an individual Cell in a Grid.
 */
export class Cell {
    parentRow: Row
    parentGrid: Grid
    XYCoordinate: Coordinate
    data: any
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
    constructor(width: number, verticalPosition: number, parentGrid: Grid, fillCells: boolean = true) {
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
    fillColumns(width: number,verticalPosition: number): void {
        let XAxis = generateCoordinateAxis(width)
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
    boundSelector: GridSelector
    identifier: string
    constructor(width: number = 1, height: number = 1,  {
            fillRows = true, 
            fillCells = true, 
            boundSelector = true,
            }: {
                fillRows?: boolean, 
                fillCells?: boolean, 
                boundSelector?: boolean, 
            }
        ) {
        this.identifier = getUniqueIdentifier().toString()
        let YAxis = generateCoordinateAxis(height)
        if (fillRows) {
            this.fillRows(width, YAxis, fillCells)
        }
        if (boundSelector) {
            this.boundSelector = new GridSelector(this)
        }
    }
    get width(): number {
        return this.rows.get(this.bottom).width
    }
    get height(): number {
        return this.rows.size
    }
    get bottom(): number {
        return Math.min(...this.CurrentYAxis)
    }
    get top(): number {
        return Math.max(...this.CurrentYAxis)
    }
    get CurrentYAxis(): Array<number> {
        return parseMapKeysToArray(this.rows)
    }
    /**
     * 
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
        let cell
        cell = this.hasRow(y) ? this.row(y).column(x) : undefined
        return cell
    }
    hasRow(YCoordinate: number): boolean {
        return this.row(YCoordinate) != undefined
    }
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
        let oldMapCopy = new Map(this.rows)
        let width = this.width
        this.rows.clear()
        for (let i = 0; i < amount; i++) {
            this.set(verticalPosition,new Row(width,verticalPosition, this))
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
        // removes given number of tiles from given side of every row in the Grid.
        this.rows.forEach((row) => {
            row._shortenRow(amount,from)
        })
    }
}
/**
 * Represents a set of cells in a Grid on which operations can be done.
 */
export class GridSelector{
    selection: Grid
    clipboard: Grid
    parentGrid: Grid
    identifier: string
    positionDelta: Coordinate = [0,0]
    constructor(parentGrid: Grid) {
        this.parentGrid = parentGrid
        this.identifier = parentGrid.identifier
        let emptyGridParams = {
            fillCells: false,
            fillRows: false,
            boundSelector: false,
        }
        this.selection = new Grid(0,0, emptyGridParams)
        this.clipboard = new Grid(0,0, emptyGridParams)
    }
    /**
     * Sets the change in position desired for actions done on the selection. 
     * In future, these initialXY and finalXY values will be provided by a mousedown 
     * and mouseup event listener on the selected and destination tiles. 
     * Deltas read from top-leftmost cell of selection.
     */
    setPositionDelta(initialXY: Coordinate,finalXY: Coordinate): void {
        this.positionDelta = readPositionDelta(initialXY,finalXY)
    }
    /**
     * Executes a callback function at each element in the selection array. The callback function is given access to all local variables from iteration, in order: currentCell, destinationCell, returnVariable, deltaX, deltaY, i.
     * @param callback A function to execute at each element in the selection.
     * @param returnVariable Optional. A variable which can be modified by the callback function to pass back to the caller.
     * @returns Returns void if no returnVariable is given, or returns whatever is assigned to the returnVariable.
     */
    _iterateOverSelection(callback: Function, returnVariable?: any): void | any {
        let [deltaX,deltaY] = this.positionDelta
        this.selection.rows.forEach((currentRow, YPosition, selection) =>{
            currentRow.columns.forEach((currentCell, XPosition, row) => {
                let [initialX, initialY] = [XPosition, YPosition]
                let [finalX, finalY] = [initialX + deltaX, initialY + deltaY]
                let destinationCell = this.parentGrid.cell([finalX, finalY])
                callback({
                    initialPosition: [initialX, initialY],
                    finalPosition: [finalX, finalY],
                    currentCell: currentCell,
                    destinationCell: destinationCell,
                })
            } )
        })
        if (returnVariable != undefined) {
            return returnVariable
        }
    }
    batchSelect(cells: Array<Coordinate>): void {
        for (let i = 0; i < cells.length; i++) {
            this.select(cells[i])
        }
    }
    /**
     * Adds the Cell at the given XY coordinate into the selection, if it exists.
     * @param XYCoordinate 
     */
    select([cellX,cellY]: Coordinate): void {
        let cellInParent = this.parentGrid.cell([cellX,cellY])
        if (this.parentGrid.hasCell([cellX, cellY])) {
            if (this.selection.hasRow(cellY)) {
                this._selectInKnownRow([cellX,cellY],cellInParent)
            } else {
                this._selectInNewRow([cellX,cellY],cellInParent)
            }
        }
    }
    _selectInNewRow([cellX, cellY]: Coordinate, cellInParent: Cell): void {
        let newEmptyRow = new Row(0,cellY,this.selection,false)
        this.selection.rows = insertElementInMap(this.selection.rows, cellY, newEmptyRow)
        let newRow = this.selection.row(cellY)
        newRow.set(cellX, cellInParent)
    }
    _selectInKnownRow([cellX, cellY]: Coordinate, cellInParent: Cell): void {
        let knownRow = this.selection.row(cellY)
        if (knownRow.column(cellX) == undefined) {
            knownRow.columns = insertElementInMap(knownRow.columns, cellX, cellInParent)
        }
    }
    /**
     * Remove a cell from the current selection.
     */
    deselect([cellX, cellY]: Coordinate): void {
        if (this.selection.hasRow(cellY)) {
            let row = this.selection.row(cellY)
            if (row.hasCell(cellX)) {
                row.columns.delete(cellX)
            }
        }
    }
    /**
     * Moves selected cells to desired location.
     * @see _iterateOverSelection
     */
    move(positionDelta): void {
        this.positionDelta = positionDelta
        this._iterateOverSelection((params)=>{
            params.destinationCell.data = params.currentCell.data
        })
        this.delete()
        this.shift(positionDelta)
    }
    /**
     * Switches selected cells with desired destination cells. 
     * @see _iterateOverSelection
     */
    swap(positionDelta): void {
        this.positionDelta = positionDelta
        this._iterateOverSelection((params) => {
            [params.currentCell.data, params.destinationCell.data] = [params.destinationCell.data, params.currentCell.data]
        })
    }
    /**
     * Fills each cell in the selection with the given data.
     * @param data The data with which to fill each cell.
     * @see _iterateOverSelection
     */
    fill(data: any): void {
        this._iterateOverSelection((currentCell)=>{
            currentCell.data = data
        })
    }
    /**
     * Creates a copy of the current selection into the clipboard to be used later.
     */
    copy(): void {
        this.clipboard = Object.assign({},this.selection)
    }
    cut() {
        this.copy()
        this.clear()
    }
    /**
     * Places a duplicate of the selection copied into the location selected, relative to the top-leftmost tile in the selection.
     */
    paste(positionDelta): void {
        this.positionDelta = positionDelta
        this._iterateOverSelection((params) => {

        })
    }
    clearClipboard(): void  {
        this.clipboard.rows.clear()
    }
    rotate(center: Cell,amount: QuantizedAngle,clockwise: boolean): void {

    }
    /**
     * Removes the data of each cell in the selection.
     * @see _iterateOverSelection
     */
    delete(): void {
        this._iterateOverSelection((params)=>{
            params.currentCell.data = undefined
        })
    }
    /**
     * Moves selection to desired destination.
     * @see _iterateOverSelection
     */
    shift(positionDelta: Coordinate): void {
        this.positionDelta = positionDelta
        let selectionDelta = {
            current: [],
            result: []
        }
        selectionDelta = this._iterateOverSelection((params) => {
            selectionDelta.current.push(params.initialPosition)
            selectionDelta.result.push(params.finalPosition)
        }, selectionDelta)
        this.clear()
        for (let i = 0; i < selectionDelta.result.length; i++) {
            let cell = selectionDelta.result[i]
            if (selectionDelta.current.includes(cell) == false) {
                this.select(cell)
            }
        }
    }
    /**
     * Clears the current selection.
     */
    clear(): void {
        this.selection.rows.clear()
    }
    /**
     * Exports the current selection to a JSON file to be rendered with a Grid renderer.
     */
    export(): void {
    }
    /**
     * The root cell is the cell which all actions on the selection are done relative to. 
     * By default, the root is the top-leftmost cell in the selection, though this can be changed with the direction flag.
     * Top is prioritized; that is, even if a piece is further left than another, the higher one will be returned.
     * @see _iterateOverSelection
     */
    getRootCell(direction: AdjacentDirection = "top-left"): Cell {
        let [vertical, horizontal] = direction.split('-')
        let YPosition = this.selection[vertical]
        let row = this.selection.row(YPosition)
        let XPosition = row[horizontal]
        let rootCell = row.column(XPosition)
        return rootCell
    }
}