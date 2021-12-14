

function main_process(tick_rate:number): void {
    setup_main_process()
    run_main_loop(tick_rate)
}

function setup_main_process() {

}

function run_main_loop(tick_rate:number): void {
    let time = new Date();
    if (main_process.terminate_program == false) {
        setTimeout(() => {
            console.log(`${time.getMilliseconds()}: running...`)
            run_main_loop(tick_rate)
        },tick_rate)
    } else {
        console.log(`${time.getMilliseconds()}: halted.`)
    }
}

main_process.terminate_program = false;
main_process.terminate = () => {
    main_process.terminate_program = true
}

type Coordinate = [number,number] 
type CoordinateAxis = Array<number>
type GridJSON = string
type CellType = 'connection' | 'node' | 'none'
type Direction = 'top' | 'bottom' | 'left' | 'right'
type AdjacentDirection = 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
type QuantizedAngle = 0 | 90 | 270 | 360
/**
 * Lists all Direction and AdjacentDirection strings in counterclockwise order.
 */
const Directions = ['topleft', 'top', 'topright', 'right', 'bottomright', 'bottom', 'bottomleft', 'left']

/**
 * Represents a set of cells in a Grid on which operations can be done.
 */
class GridSelection {
    selection: Grid
    clipboard: Grid
    parentGrid: Grid
    positionDelta: Coordinate = [0,0]
    constructor(parentGrid: Grid) {
        this.parentGrid = parentGrid
        this.selection = new Grid(parentGrid.width, parentGrid.height, {
            fillCells: false,
            fillRows: false,
            boundController: false,
            boundRenderer: false
        })
    }
    /**
     * Sets the change in position desired for actions done on the selection. In future, these initialXY and finalXY values will be provided by a mousedown and mouseup event listener on the selected and destination tiles. Deltas read from top-leftmost cell of selection.
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
        for (let row in this.selection.rows.keys()) {
            // Needs to be rewritten to do something similar to this, but with the sorted map structure now available.
            //let currentCell = 
            //let [initialX,initialY] = currentCell.XYCoordinate
            //let [finalX,finalY] = [initialX + deltaX, initialY + deltaY]
            //let destinationCell = this.parentGrid.cell([finalX,finalY])
            //callback(currentCell,destinationCell,returnVariable,deltaX,deltaY,i)
        }
        if (returnVariable != undefined) {
            return returnVariable
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
     * Moves selected cells to desired location.
     * @see _iterateOverSelection
     */
    move(): void {
        this._iterateOverSelection((currentCell,destinationCell)=>{
            destinationCell.data = currentCell.data
        })
        this.delete()
        this.shift()
    }
    /**
     * Switches selected cells with desired destination cells. 
     * @see _iterateOverSelection
     */
    swap(): void {
        this._iterateOverSelection((currentCell,destinationCell) => {
            [currentCell.data, destinationCell.data] = [destinationCell.data, currentCell.data]
        })
        this.shift()
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
        this.clipboard = this.selection
        this.clear()
    }
    /**
     * Places a duplicate of the selection copied into the location selected, relative to the top-leftmost tile in the selection.
     */
    paste(): void {

    }
    rotate(center: Cell,amount: QuantizedAngle,clockwise: boolean): void {

    }
    /**
     * Removes the data of each cell in the selection.
     * @see _iterateOverSelection
     */
    delete(): void {
        this._iterateOverSelection((currentCell)=>{
            currentCell.data = undefined
        })
    }
    /**
     * Moves selection to desired destination. Needs to be rewritten, but would function something like this.
     * @see _iterateOverSelection
     */
    shift(): void {
 
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
     * @see _iterateOverSelection
     * In future, the direction and priority defaults should be determined in an options system.
     */
    getRootCell(direction: AdjacentDirection = "topleft", priority: Direction = "top"): Cell {
        let rootCell
        let rootSearchLogic = this.parseRootCellDirection(direction)
        this._iterateOverSelection((currentCell,destinationCell,rootCell)=>{
            let currentXY = currentCell.XYCoordinate
            let lastFurthestXY = rootCell.XYCoordinate
            rootCell = rootSearchLogic(currentXY,lastFurthestXY) ? currentCell : rootCell
        },rootCell)

        return rootCell
    }
    /**
     * 
     * @param direction 
     * @returns Returns an anonymous function containing the logic to determine the root cell from a set of XY coordinates and the XY coordinates of the last furthest tile identified.
     * @see getRootCell
     */
    parseRootCellDirection(direction: AdjacentDirection): Function {
        switch (direction) {
            case "topleft": return ([currentX,currentY],[furthestX,furthestY]) => {
                return currentX < furthestX || currentY > furthestY
            }
            case "topright": return ([currentX,currentY],[furthestX,furthestY]) => {
                return currentX > furthestX || currentY > furthestY
            }
            case "bottomright": return ([currentX,currentY],[furthestX,furthestY]) => {
                return currentX > furthestX || currentY > furthestY
            }
            case "bottomleft": return ([currentX,currentY],[furthestX,furthestY]) => {
                return currentX < furthestX || currentY < furthestY
            }
        }
    }
}

/**
 * Sets up a data structure for an individual Cell in a Grid.
 */
class Cell {
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
    adjacentCells([x,y] = this.XYCoordinate): object {
        let rowAbove = this.parentGrid.row(y + 1)
        let rowBelow = this.parentGrid.row(y - 1)
        return {
            'top' : rowAbove ? rowAbove.column(x) : undefined,
            'topleft': rowAbove ? rowAbove.column(x - 1) : undefined,
            'topright': rowAbove ? rowAbove.column(x + 1) : undefined,
            'bottom' : rowBelow ? rowAbove.column(x) : undefined,
            'bottomleft': rowBelow ? rowAbove.column(x - 1) : undefined,
            'bottomright': rowBelow ? rowAbove.column(x + 1) : undefined,
            'left' : this.parentRow.column(x - 1),
            'right': this.parentRow.column(x + 1)
        }
    }
}

/**
 * Sets up a data structure for a linear row of cells accessible by X-coordinate indices.
 * For a Row which is part of a larger Grid, Row size modification methods are not intended to be called directly but instead through it's parent Grid.
 */
class Row {
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
class Grid {
    rows: Map<number,Row> = new Map();
    boundRenderer: GridRenderer
    boundController: GridController
    constructor(width: number = 1, height: number = 1, opts = {
            fillRows: true, 
            fillCells: true, 
            boundRenderer: true, 
            boundController: true
            }
        ) {
        let YAxis = generateCoordinateAxis(height)
        if (opts.fillRows) {
            this.fillRows(width, YAxis, opts.fillCells)
        }
        if (opts.boundRenderer) {
            this.boundRenderer = new GridRenderer(this)
        }
        if (opts.boundController) {
            this.boundController = new GridController(this, this.boundRenderer)
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
        this.rows.clear()
        for (let i = 0; i < amount; i++) {
            this.set(verticalPosition,new Row(this.width,verticalPosition, this))
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
 * Sets up a renderer for a grid, 
 * capable of creating or modifying html elements on the fly to reflect changes in the data.
 */
class GridRenderer {
    childGrid: Grid
    tileset: object
    frame: HTMLElement
    constructor(childGrid: Grid,tileset?: object) {
        if (document.getElementById('Grid_Renderer_Frame') == undefined) {
            let div = document.createElement("div")
            document.body.appendChild(div).id = "Grid_Renderer_Frame"
        }
        this.frame = document.getElementById('Grid_Renderer_Frame')
        this.frame.classList.add('grid-renderer-frame')
        this.childGrid = childGrid
        tileset? this.tileset = tileset : null
        this.renderChildGridToHTML()
    }
    renderChildGridToHTML() {
        this.resolveData_DocumentDeltas()
        //setup menus
        //setup listening for changes in grid data
    }
    resolveData_DocumentDeltas() {
        this.checkRowsInDocument()
        this.checkCellsInDocument()
        this.checkRowsInGrid()
    }
    checkRowsInGrid() {
        this.childGrid.rows.forEach((row,YPosition,grid) => {
            if (documentHasRow(YPosition)) {
                this.checkCellsInRowInGrid(row,YPosition)
            } else {
                this.addRowToDocument(row,YPosition)
            } 
        })
    }
    checkCellsInRowInGrid(row,YPosition) {
        row.columns.forEach((column,XPosition,grid) => {
            if (!documentHasCell([XPosition,YPosition])) {
                this.addCellToDocument([XPosition,YPosition])
            }
        })
    }
    checkRowsInDocument() {
        let rows = document.getElementsByClassName('grid-row')
        let removalQueue: Array<Node> = []
        for (let i=0; i < rows.length; i++) {
            let row = rows.item(i)
            let id = row.id
            let index = parseInt(id.split(' ')[1])
            if (this.childGrid.hasRow(index) == false) {
                removalQueue.push(row)
            }
        }
        this.fulfillRowRemovalQueue(removalQueue)
    }
    checkCellsInDocument() {
        let cells = document.getElementsByClassName('grid-cell')
        let removalQueue: Array<[Node,number]> = []
        for (let i = 0; i < cells.length; i++) {
            let cell = cells.item(i)
            let id = cell.id
            let [itemName, XString, YString] = id.split(' ')
            let [XPosition, YPosition] = [parseInt(XString), parseInt(YString)]
            if (this.childGrid.hasCell([XPosition, YPosition]) == false) {
                removalQueue.push([cell,YPosition])
            }
        }
        this.fulfillCellRemovalQueue(removalQueue)
    }
    addRowToDocument(row,YPosition) {
        let HTMLRow = document.createElement("div")
        this.frame.appendChild(HTMLRow).id = `row ${YPosition}`
        let HTMLRowReference = getRowReference(YPosition)
        HTMLRowReference.classList.add('grid-row')
        HTMLRowReference.style.order = `${YPosition}`
        row.columns.forEach((column, XPosition, row) => {
            if (!documentHasCell([XPosition, YPosition])) {
                this.addCellToDocument([XPosition,YPosition])
            }
        })
    }
    addCellToDocument([XPosition, YPosition]: Coordinate) {
        let div = document.createElement("div")
        let HTMLRowReference = getRowReference(YPosition)
        HTMLRowReference.appendChild(div).id = `cell ${XPosition} ${YPosition}`
        let HTMLCellReference = getCellReference([XPosition, YPosition])
        HTMLCellReference.classList.add('grid-cell')
        HTMLCellReference.style.order = `${XPosition}`
    }
    fulfillRowRemovalQueue(removalQueue: Array<Node>) {
        for (let i = 0; i < removalQueue.length; i++) {
            let row = removalQueue[i]
            this.removeRowFromDocument(row)
        }
    }
    fulfillCellRemovalQueue(removalQueue: Array<[Node,number]>) {
        for (let i = 0; i < removalQueue.length; i++) {
            let cell = removalQueue[i][0]
            let YPosition = removalQueue[i][1]
            this.removeCellFromDocument(cell, YPosition)
        }
    }
    removeRowFromDocument(row) {
        this.frame.removeChild(row)
    }
    removeCellFromDocument(cell,YPosition) {
        let row = getRowReference(YPosition)
        row.removeChild(cell)
    }
    renderGridFromJSON(presetGrid: GridJSON) {

    }
}
class GridController {

    constructor(childGrid: Grid, boundRenderer: GridRenderer) {

    }
    setupKeyboardListeners() {

    }
}

/**
 * Determines whether a number is even.
 * @param n a whole number.
 */
function isEven(n: number): boolean {
    return n % 2 == 0;
}
/**
 * Makes a number negative.
 */
function negative(n: number): number {
    if (n >= 0) {
        return -n
    } else {
        return n
    }
}
/**
 * Makes a number positive.
*/
function positive(n: number): number {
    if (n >= 0) {
        return n
    } else {
        return -n
    }
}

function getRowReference(y: number) {
    return document.getElementById(`row ${y}`)
}
function getCellReference([x,y]:Coordinate) {
    return document.getElementById(`cell ${x} ${y}`)
}
function documentHasCell([x,y]: Coordinate): boolean {
    return getCellReference([x,y]) != null
}
function documentHasRow(y: number): boolean {
    return getRowReference(y)!= null
}

/**
 * Generates an array of numbers representing labels on a coordinate axis.
 * Sizes are always made odd to allow a centre at (0,0).
 * @param size the desired total size of the axis. Should be odd for best results.
 * @returns Returns an array with a length equal to size and a zero in the middle.
 * @example
 * generateCoordinateAxis(5)
 * // Returns [-2,-1,0,1,2]
 * @example
 * generateCoordinateAxis(10)
 * // Returns [-5,-4,-3,-2,-1,0,1,2,3,4,5]
 * @example 
 * generateCoordinateAxis(1)
 * // Returns [0]
 */
function generateCoordinateAxis(size: number): CoordinateAxis {
    let distanceFromOrigin: number;
    let axis = [];
    if (isEven(size)) {
        size += 1
    }
    distanceFromOrigin = Math.floor(size/2)
    for (let i = 0; i < size; i++) {
        axis.push(negative(distanceFromOrigin) + i)
    }
    return axis
}

/**
 * Generate an array containing all the key names of a given map.
 * @example
 * parseMapKeysToArray({-1 => 'foo', 0 => 'bar', 1 => 'baz'})
 * // returns [-1,0,1]
 */
function parseMapKeysToArray(map: Map<any,any>): Array<any> {
    let iterable = map.keys()
    let next;
    let array = []
    do {
        next = iterable.next()
        if (next.value != undefined) {
            array.push(next.value)
        }
    } while (next.done === false)
    return array
}

/**
 * Measures the distance between two Coordinates.
 * @returns Returns a coordinate pair representing the position delta.
 * @example
 * readPositionDelta([0,4],[3,-2])
 * // Returns [3,-6]
 */
function readPositionDelta( [initialX, initialY] : Coordinate, [finalX, finalY] : Coordinate) : Coordinate {
    let deltaX = finalX - initialX
    let deltaY =  finalY - initialY
    return [deltaX, deltaY]
}

/**
 * Appends all elements of the source map, in order, onto the end of the target map.
 * Mutates the second map passed.
 * Note: Expects that maps do not have overlapping key names.
 * @param source the map to take elements from.
 * @param target the map onto which elements are added.
 * @returns the modified target map.
 * @example
 * concatenateMaps({1 => 'foo', 2 => 'foo', 3 => 'foo'}, {0 => 'baz'})
 * // returns {0 => 'baz', 1 => 'foo', 2 => 'foo', 3 => 'foo'}
 */
function concatenateMaps(source: Map<any,any>, target: Map<any,any>): Map<any,any> {
    source.forEach((value,key)=>{
        target.set(key,value)
    })
    return target
}
/**
 * For an array sorted from negative to positive (or positive to negative if reversed = true), inserts a number
 * in the position where the number on its left is smaller than it, and the number on its irght is larger than it,
 * (in correct numerical order) by recursively halving the array and searching in the subarrays produced to finally produce
 * the index desired.
 * @param map 
 */
function insertElementInMap(map: Map<number,any>,indexToInsert: number, elementToInsert: any, reverse: boolean = false) {
    let array = []
    let comparatorFunction = getSortComparator(reverse)
    let sortedMap = new Map();
    array = fillArrayWithMapKeys(array, map)
    array.push(indexToInsert)
    array.sort(comparatorFunction)
    for (let i= 0; i < array.length; i++) {
        let key = array[i]
        if (key == indexToInsert) {
            sortedMap.set(key, elementToInsert)
        } else {
            sortedMap.set(key, map.get(key))
        }
    }
    return sortedMap
}

function getSortComparator(reverse: boolean) {
    switch (reverse) {
        case false: return (a,b) => {return a - b}
        case true: return (a,b) => {return b - a}
    }
}

function fillArrayWithMapKeys(array, map: Map<number, any>) {
    map.forEach((value,key,map)=>{
        array.push(key)
    })
    return array
}

