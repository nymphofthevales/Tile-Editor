function main_process(tick_rate) {
    setup_main_process();
    run_main_loop(tick_rate);
}
function setup_main_process() {
}
function run_main_loop(tick_rate) {
    let time = new Date();
    if (main_process.terminate_program == false) {
        setTimeout(() => {
            console.log(`${time.getMilliseconds()}: running...`);
            run_main_loop(tick_rate);
        }, tick_rate);
    }
    else {
        console.log(`${time.getMilliseconds()}: halted.`);
    }
}
main_process.terminate_program = false;
main_process.terminate = () => {
    main_process.terminate_program = true;
};
class GridSelection {
    constructor() {
        this.contents = [];
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
    constructor(column, row) {
        this.XYCoordinate = [column, row];
    }
}
class Row {
    constructor(width, verticalPosition) {
        this.contents = new Map();
        this.position = 0;
        this.fillTiles(width, verticalPosition);
        this.position = verticalPosition;
    }
    fillTiles(width, verticalPosition) {
        let XAxis = generateCoordinateAxis(width);
        for (let i = 0; i < XAxis.length; i++) {
            this.contents.set(XAxis[i], new Tile(XAxis[i], verticalPosition));
        }
    }
    expandRow(amount, to) {
    }
    shortenRow(amount, from) {
    }
}
class Grid {
    constructor(width, height) {
        this.rows = new Map();
        this.width = width;
        this.fillRows(generateCoordinateAxis(height), width);
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
    fillRows(YAxis, width) {
        for (let i = 0; i < YAxis.length; i++) {
            this.rows.set(YAxis[i], new Row(width, YAxis[i]));
        }
    }
    get CurrentYAxis() {
        return parseMapKeysToArray(this.rows);
    }
    increaseHeight(amount, to) {
        let YAxis = this.CurrentYAxis;
        if (to === 'bottom') {
            this._addRowsToBottom(amount, YAxis);
        }
        else if (to === 'top') {
            this._addRowsToTop(amount, YAxis);
        }
    }
    _addRowsToTop(amount, YAxis) {
        //continues after most recent elements in map; no change in order necessary
        let verticalPosition = this.top + 1;
        for (let i = 0; i < amount; i++) {
            this.rows.set(verticalPosition, new Row(this.width, verticalPosition));
            verticalPosition++;
        }
    }
    _addRowsToBottom(amount, YAxis) {
        //needs to add to the beginning of the map; reassignment of order necessary
        let verticalPosition = this.bottom - amount;
        let oldMapCopy = new Map(this.rows);
        this.rows.clear();
        for (let i = 0; i < amount; i++) {
            this.rows.set(verticalPosition, new Row(this.width, verticalPosition));
            verticalPosition++;
        }
        this.rows = concatenateMaps(oldMapCopy, this.rows);
    }
    reduceHeight(amount, from) {
        if (from === 'bottom') {
            for (let i = 0; i < amount; i++) {
            }
            this.rows.delete(this.bottom);
        }
        else if (from === 'top') {
        }
    }
    increaseWidth(amount, to) {
    }
    reduceWidth(amount, from) {
    }
    shiftRow() {
    }
    moveSelection(selection, from, to) {
    }
}
function generateCoordinateAxis(size) {
    //Returns an array of length = size, centered at zero. sizes are always made odd to allow a centre at (0,0).
    //  generateCoordinateAxis(5)
    //  [-2,-1,0,1,2]
    //  generateCoordinateAxis(10)
    //  [-5,-4,-3,-2,-1,0,1,2,3,4,5]
    //  generateCoordinateAxis(1)
    //  [0]
    let distanceFromOrigin;
    let index = [];
    if (isEven(size)) {
        size += 1;
    }
    distanceFromOrigin = Math.floor(size / 2);
    for (let i = 0; i < size; i++) {
        index.push(-distanceFromOrigin + i);
    }
    return index;
}
function isEven(n) {
    if (n % 2 === 0) {
        return true;
    }
    else {
        return false;
    }
}
function parseMapKeysToArray(map) {
    let iterable = map.keys();
    let next;
    let array = [];
    do {
        next = iterable.next();
        if (next.value != undefined) {
            array.push(next.value);
        }
    } while (next.done === false);
    return array;
}
function concatenateMaps(sourceMap, targetMap) {
    sourceMap.forEach((value, key, map) => {
        targetMap.set(key, value);
    });
    return targetMap;
}
