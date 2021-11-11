

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
type CellType = 'connection' | 'node' | 'none'
type Direction = 'top' | 'bottom' | 'left' | 'right'

class GridSelection {
    contents: Cell[] = []

    constructor() {

    }
    move() {
        //move the selected tiles to a new location
    }
    fill() {
        //fill the selected tiles with a particular type
    }
    delete() {
        //clear all selected tiles of their type (type -> none)
    }
    clear() {
        //deselect the current selection
    }
    export() {
        //export the current selected area to JSON
    }
}

class Cell {
    XYCoordinate: Coordinate
    type: CellType

    constructor(column: number,row: number) {
        this.XYCoordinate = [column,row];
    }
}

/**
 * Sets up a data structure for a linear row of cells accessible by X-coordinate indices.
 * For a Row which is part of a larger Grid, Row size modification methods are not intended to be called directly but instead through it's parent Grid
 */
class Row {
    columns: Map<number,Cell> = new Map();
    verticalPosition: number = 0

    constructor(width: number,verticalPosition: number) {
        this.fillColumns(width,verticalPosition)
        this.verticalPosition = verticalPosition;
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
    column(XCoordinate: number): Cell {
        return this.columns.get(XCoordinate)
    }
    /**
     * Sets up basic structure of a Row 
     * @param width 
     * @param verticalPosition 
     */
    fillColumns(width: number,verticalPosition: number): void {
        let XAxis = generateCoordinateAxis(width)
        for (let i = 0; i < XAxis.length; i++) {
            this.columns.set( XAxis[i] , new Cell(XAxis[i],verticalPosition) )
        }
    }
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
            this.columns.set(rightmostPosition,new Cell(rightmostPosition,this.verticalPosition))
            rightmostPosition++
        }
    }
    _addCellsToLeft(amount: number) {
        //negative x values
        let leftmostPosition = this.left - amount
        let oldMapCopy = new Map(this.columns)
        this.columns.clear()
        for (let i = 0; i < amount; i++) {
            this.columns.set(leftmostPosition,new Cell(leftmostPosition,this.verticalPosition))
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
 * @example
 * testGrid = new Grid(10,10)
 * testGrid.row(-1).column(2)
 * // Returns Cell with XYCoordinate (2,1)
 */
class Grid {
    rows: Map<number,Row> = new Map();
    constructor(width: number, height: number) {
        this.fillRows(generateCoordinateAxis(height),width)
    }
    /**
     * Get the Row at the specified coordinate.
     * @param YCoordinate a number that exists within the 
     */
    row(YCoordinate: number): Row {
        return this.rows.get(YCoordinate)
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
    checkInconsistentRowWidths(): boolean {
        let widths = []
        this.rows.forEach((row,key)=>{
            for (let i = 0; i < widths.length; i++) {
                if (row.width != widths[i]) {
                    throw new Error(`Inconsistent row widths in Grid at row ${key}`)
                }
            }
            widths.push(row.width)
        })
        return false
    }
    /**
     * Sets up the basic structure of a 2D Grid as a map of rows accessible by Y-axis coordinates centered at an origin.
     * @param YAxis An axis generated by generateCoordinateAxis().
     * @param width The desired width of the grid.
     * @see generateCoordinateAxis
     * @see Row
     * @see Row.fillCells
     */
    fillRows(YAxis: CoordinateAxis,width: number) {
        for (let i = 0; i < YAxis.length; i++) {
            this.rows.set( YAxis[i] , new Row(width,YAxis[i]) )
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
    _addRowsToTop(amount: number,YAxis: CoordinateAxis) {
        //continues after most recent elements in map; no change in order necessary
        let verticalPosition = this.top + 1
        for (let i=0; i < amount; i++) {
            this.rows.set(verticalPosition, new Row(this.width,verticalPosition))
            verticalPosition++
        }
    }
    _addRowsToBottom(amount: number,YAxis: CoordinateAxis) {
        //needs to add to the beginning of the map; reassignment of order necessary
        let verticalPosition = this.bottom - amount
        let oldMapCopy = new Map(this.rows)
        this.rows.clear()
        for (let i = 0; i < amount; i++) {
            this.rows.set(verticalPosition,new Row(this.width,verticalPosition))
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
    shiftRow() {
        //move whole row in vertical order
        //redundant. serves same purpose as just running moveSelection() on a whole row.
    }
    moveSelection(selection: GridSelection, from: Coordinate, to: Coordinate) {

    }
}

/**
 * Generates an array of numbers representing labels on a coordinate axis. 
 * Sizes are always made odd to allow a centre at (0,0). 
 * @param size the desired total size of the axis. Should be odd.
 * @returns Returns an array with a length equal to and a zero in the middle.
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
    let index = [];
    if (isEven(size)) {
        size += 1
    }
    distanceFromOrigin = Math.floor(size/2)
    for (let i = 0; i < size; i++) {
        index.push(-distanceFromOrigin + i)
    }
    return index
}

function isEven(n: number): boolean {
    return n % 2 == 0;
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

