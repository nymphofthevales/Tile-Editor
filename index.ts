

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
type TileType = 'connection' | 'node' | 'none'
type Direction = 'top' | 'bottom' | 'left' | 'right'

class GridSelection {
    contents: Tile[] = []

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

class Tile {
    XYCoordinate: Coordinate
    type: TileType

    constructor(column: number,row: number) {
        this.XYCoordinate = [column,row];
    }
}

class Row {
    contents: Map<number,Tile> = new Map();
    verticalPosition: number = 0

    constructor(width: number,verticalPosition: number) {
        this.fillTiles(width,verticalPosition)
        this.verticalPosition = verticalPosition;
    }
    get width(): number {
        return this.contents.size
    }
    get left(): number {
        return Math.min(...this.CurrentXAxis)
    }
    get right(): number {
        return Math.max(...this.CurrentXAxis)
    }
    get CurrentXAxis(): Array<number> {
        return parseMapKeysToArray(this.contents)
    }
    fillTiles(width: number,verticalPosition: number): void {
        let XAxis = generateCoordinateAxis(width)
        for (let i = 0; i < XAxis.length; i++) {
            this.contents.set( XAxis[i] , new Tile(XAxis[i],verticalPosition) )
        }
    }
    _expandRow(amount: number, to: Direction): void {
        //should not be called directly, but instead through its parent Grid.increaseWidth method.
        if (to === "right") {
            this._addTilesToRight(amount)
        } else if (to === "left") {
            this._addTilesToLeft(amount)
        } else {
            throw new Error('Invalid direction.')
        }
    }
    _addTilesToRight(amount: number) {
        //positive x values
        let rightmostPosition = this.right + 1
        for (let i = 0; i < amount; i++) {
            this.contents.set(rightmostPosition,new Tile(rightmostPosition,this.verticalPosition))
            rightmostPosition++
        }
    }
    _addTilesToLeft(amount: number) {
        //negative x values
        let leftmostPosition = this.left - amount
        let oldMapCopy = new Map(this.contents)
        this.contents.clear()
        for (let i = 0; i < amount; i++) {
            this.contents.set(leftmostPosition,new Tile(leftmostPosition,this.verticalPosition))
            leftmostPosition++
        }
        this.contents = concatenateMaps(oldMapCopy,this.contents)
    }
    _shortenRow(amount: number, from: Direction): void {
        //should not be called directly, but instead through its parent Grid.reduceWidth method.
        if (amount > this.width) {
            throw new Error('Cannot shorten row width below 0.')
        } else if (from === 'left') {
            for (let i = 0; i < amount; i++) {
                this.contents.delete(this.left)
            }
        } else if (from === 'right') {
            for (let i = 0; i < amount; i++) {
                this.contents.delete(this.right)
            }
        }
    }
}

class Grid {
    rows: Map<number,Row> = new Map();
    constructor(width: number, height: number) {
        this.fillRows(generateCoordinateAxis(height),width)
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
        this.rows.forEach((row)=>{
            row._expandRow(amount,to)
        })
    }
    reduceWidth(amount: number, from: Direction): void  {
        this.rows.forEach((row)=>{
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

function generateCoordinateAxis(size: number): CoordinateAxis {
    //Returns an array of length = size, centered at zero. sizes are always made odd to allow a centre at (0,0).
    //  generateCoordinateAxis(5)
    //  [-2,-1,0,1,2]
    //  generateCoordinateAxis(10)
    //  [-5,-4,-3,-2,-1,0,1,2,3,4,5]
    //  generateCoordinateAxis(1)
    //  [0]
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
    if (n % 2 === 0) {
        return true
    } else {
        return false
    }
}

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

function concatenateMaps(sourceMap: Map<any,any>, targetMap: Map<any,any>): Map<any,any> {
    sourceMap.forEach((value,key,map)=>{
        targetMap.set(key,value)
    })
    return targetMap
}

