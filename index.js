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
/**
 * Lists all Direction and AdjacentDirection strings in counterclockwise order.
 */
const Directions = ['topleft', 'top', 'topright', 'right', 'bottomright', 'bottom', 'bottomleft', 'left'];
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
/**
 * Sets up a data structure for an individual Cell in a Grid.
 */
class Cell {
    constructor(column, row, parentGrid, parentRow) {
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
    adjacentCells([x, y] = this.XYCoordinate) {
        let rowAbove = this.parentGrid.row(y + 1);
        let rowBelow = this.parentGrid.row(y - 1);
        return {
            'top': rowAbove ? rowAbove.column(x) : undefined,
            'topleft': rowAbove ? rowAbove.column(x - 1) : undefined,
            'topright': rowAbove ? rowAbove.column(x + 1) : undefined,
            'bottom': rowBelow ? rowAbove.column(x) : undefined,
            'bottomleft': rowBelow ? rowAbove.column(x - 1) : undefined,
            'bottomright': rowBelow ? rowAbove.column(x + 1) : undefined,
            'left': this.parentRow.column(x - 1),
            'right': this.parentRow.column(x + 1)
        };
    }
}
/**
 * Sets up a data structure for a linear row of cells accessible by X-coordinate indices.
 * For a Row which is part of a larger Grid, Row size modification methods are not intended to be called directly but instead through it's parent Grid
 */
class Row {
    constructor(width, verticalPosition, parentGrid) {
        this.columns = new Map();
        this.verticalPosition = 0;
        this.parentGrid = parentGrid;
        this.verticalPosition = verticalPosition;
        this.fillColumns(width, verticalPosition);
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
    get rowAbove() {
        let YAbove = this.verticalPosition + 1;
        return this._getAdjacentRow(YAbove);
    }
    get rowBelow() {
        let YBelow = this.verticalPosition - 1;
        return this._getAdjacentRow(YBelow);
    }
    _getAdjacentRow(position) {
        return this.parentGrid.row(position);
    }
    column(XCoordinate) {
        return this.columns.get(XCoordinate);
    }
    /**
     * Sets up basic structure of a Row filled with Cells. Each Cell corresponds to a column in 2D space.
     * @param width
     * @param verticalPosition
     */
    fillColumns(width, verticalPosition) {
        let XAxis = generateCoordinateAxis(width);
        for (let i = 0; i < XAxis.length; i++) {
            this.columns.set(XAxis[i], new Cell(XAxis[i], verticalPosition, this.parentGrid, this));
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
            this.columns.set(rightmostPosition, new Cell(rightmostPosition, this.verticalPosition, this.parentGrid, this));
            rightmostPosition++;
        }
    }
    _addCellsToLeft(amount) {
        //negative x values
        let leftmostPosition = this.left - amount;
        let oldMapCopy = new Map(this.columns);
        this.columns.clear();
        for (let i = 0; i < amount; i++) {
            this.columns.set(leftmostPosition, new Cell(leftmostPosition, this.verticalPosition, this.parentGrid, this));
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
 * @example
 * testGrid = new Grid(10,10)
 * testGrid.row(-1).column(2)
 * // Returns Cell with XYCoordinate (2,1)
 */
class Grid {
    constructor(width = 1, height = 1) {
        this.rows = new Map();
        let YAxis = generateCoordinateAxis(height);
        this.fillRows(YAxis, width);
    }
    /**
     * Get the Row at the specified coordinate.
     * @param YCoordinate a number that exists within the
     */
    row(YCoordinate) {
        return this.rows.get(YCoordinate);
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
     * Sets up the basic structure of a 2D Grid as a map of rows accessible by Y-axis coordinates centered at an origin.
     * @param YAxis An axis generated by generateCoordinateAxis().
     * @param width The desired width of the grid.
     * @see generateCoordinateAxis
     * @see Row
     * @see Row.fillColumns
     */
    fillRows(YAxis, width) {
        for (let i = 0; i < YAxis.length; i++) {
            this.rows.set(YAxis[i], new Row(width, YAxis[i], this));
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
            this.rows.set(verticalPosition, new Row(this.width, verticalPosition, this));
            verticalPosition++;
        }
    }
    _addRowsToBottom(amount, YAxis) {
        //needs to add to the beginning of the map; reassignment of order necessary
        let verticalPosition = this.bottom - amount;
        let oldMapCopy = new Map(this.rows);
        this.rows.clear();
        for (let i = 0; i < amount; i++) {
            this.rows.set(verticalPosition, new Row(this.width, verticalPosition, this));
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
    moveSelection(selection, from, to) {
    }
}
function isEven(n) {
    return n % 2 == 0;
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
function generateCoordinateAxis(size) {
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
/**
 * Generate an array containing all the key names of a given map.
 * @example
 * parseMapKeysToArray({-1 => 'foo', 0 => 'bar', 1 => 'baz'})
 * // returns [-1,0,1]
 */
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
function concatenateMaps(source, target) {
    source.forEach((value, key) => {
        target.set(key, value);
    });
    return target;
}
