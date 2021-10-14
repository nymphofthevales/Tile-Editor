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
        this.verticalPosition = 0;
        this.fillTiles(width, verticalPosition);
        this.verticalPosition = verticalPosition;
    }
    get width() {
        return this.contents.size;
    }
    get left() {
        return Math.min(...this.CurrentXAxis);
    }
    get right() {
        return Math.max(...this.CurrentXAxis);
    }
    get CurrentXAxis() {
        return parseMapKeysToArray(this.contents);
    }
    fillTiles(width, verticalPosition) {
        let XAxis = generateCoordinateAxis(width);
        for (let i = 0; i < XAxis.length; i++) {
            this.contents.set(XAxis[i], new Tile(XAxis[i], verticalPosition));
        }
    }
    _expandRow(amount, to) {
        //should not be called directly, but instead through its parent Grid.increaseWidth method.
        if (to === "right") {
            this._addTilesToRight(amount);
        }
        else if (to === "left") {
            this._addTilesToLeft(amount);
        }
        else {
            throw new Error('Invalid direction.');
        }
    }
    _addTilesToRight(amount) {
        //positive x values
        let rightmostPosition = this.right + 1;
        for (let i = 0; i < amount; i++) {
            this.contents.set(rightmostPosition, new Tile(rightmostPosition, this.verticalPosition));
            rightmostPosition++;
        }
    }
    _addTilesToLeft(amount) {
        //negative x values
        let leftmostPosition = this.left - amount;
        let oldMapCopy = new Map(this.contents);
        this.contents.clear();
        for (let i = 0; i < amount; i++) {
            this.contents.set(leftmostPosition, new Tile(leftmostPosition, this.verticalPosition));
            leftmostPosition++;
        }
        this.contents = concatenateMaps(oldMapCopy, this.contents);
    }
    _shortenRow(amount, from) {
        //should not be called directly, but instead through its parent Grid.reduceWidth method.
        if (amount > this.width) {
            throw new Error('Cannot shorten row width below 0.');
        }
        else if (from === 'left') {
            for (let i = 0; i < amount; i++) {
                this.contents.delete(this.left);
            }
        }
        else if (from === 'right') {
            for (let i = 0; i < amount; i++) {
                this.contents.delete(this.right);
            }
        }
    }
}
class Grid {
    constructor(width, height) {
        this.rows = new Map();
        this.fillRows(generateCoordinateAxis(height), width);
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
    checkInconsistentRowWidths() {
        let widths = [];
        this.rows.forEach((row, key) => {
            for (let i = 0; i < widths.length; i++) {
                if (row.width != widths[i]) {
                    throw new Error(`Inconsistent row widths in Grid at row ${key}`);
                }
            }
            widths.push(row.width);
        });
        return false;
    }
    fillRows(YAxis, width) {
        for (let i = 0; i < YAxis.length; i++) {
            this.rows.set(YAxis[i], new Row(width, YAxis[i]));
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
        this.rows.forEach((row) => {
            row._expandRow(amount, to);
        });
    }
    reduceWidth(amount, from) {
        this.rows.forEach((row) => {
            row._shortenRow(amount, from);
        });
    }
    shiftRow() {
        //move whole row in vertical order
        //redundant. serves same purpose as just running moveSelection() on a whole row.
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
