

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
    contents = new Map();
    position: number = 0

    constructor(width: number,verticalPosition: number) {
        this.fillTiles(width,verticalPosition)
        this.position = verticalPosition;
    }
    fillTiles(width: number,verticalPosition: number): void {
        let XAxis = generateCoordinateAxis(width)
        for (let i = 0; i < XAxis.length; i++) {
            this.contents.set( XAxis[i] , new Tile(XAxis[i],verticalPosition) )
        }
    }
    expandRow(amount: number, to: Direction): void {

    }
    shortenRow(amount: number, from: Direction): void {

    }
}

class Grid {
    rows = new Map();
    width: number;
    constructor(width: number, height: number) {
        this.width = width;
        this.fillRows(generateCoordinateAxis(height),width)
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
    fillRows(YAxis: CoordinateAxis,width: number) {
        for (let i = 0; i < YAxis.length; i++) {
            this.rows.set( YAxis[i] , new Row(width,YAxis[i]) )
        }
    }
    get CurrentYAxis(): Array<number> {
        return parseMapKeysToArray(this.rows)
    }
    increaseHeight(amount: number, to: Direction): void  {
        let YAxis = this.CurrentYAxis
        if (to === 'bottom') {
            this._addRowsToBottom(amount,YAxis)
        } else if (to === 'top') {
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
        if (from === 'bottom') {
            for (let i = 0; i < amount; i++) {

            }
            this.rows.delete(this.bottom)
        } else if (from === 'top') {

        }
    }
    increaseWidth(amount: number, to: Direction): void  {

    }
    reduceWidth(amount: number, from: Direction): void  {

    }
    shiftRow() {

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

