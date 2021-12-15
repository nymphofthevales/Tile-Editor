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
 * Lists all Direction and AdjacentDirection strings in clockwise order.
 */
const Directions = ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'];
/**
 * Lists the cardinal Direction strings in clockwise order.
 */
const PerpendicularDirections = ['top', 'right', 'bottom', 'left'];
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
class Row {
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
class Grid {
    constructor(width = 1, height = 1, opts = {
        fillRows: true,
        fillCells: true,
        boundRenderer: true,
        boundController: true,
        boundSelector: true,
        targetElement: document.body
    }) {
        this.rows = new Map();
        this.identifier = getUniqueIdentifierString();
        let YAxis = generateCoordinateAxis(height);
        if (opts.fillRows) {
            this.fillRows(width, YAxis, opts.fillCells);
        }
        if (opts.boundRenderer) {
            this.boundRenderer = new GridRenderer(this, opts.targetElement);
        }
        if (opts.boundController) {
            this.boundController = new GridController(this, this.boundRenderer);
        }
        if (opts.boundSelector) {
            this.boundSelector = new GridSelector(this);
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
 * Represents a set of cells in a Grid on which operations can be done.
 */
class GridSelector {
    constructor(parentGrid) {
        this.positionDelta = [0, 0];
        this.parentGrid = parentGrid;
        this.identifier = parentGrid.identifier;
        this.selection = new Grid(parentGrid.width, parentGrid.height, {
            fillCells: false,
            fillRows: false,
            boundController: false,
            boundRenderer: false,
            boundSelector: false,
            targetElement: document.body
        });
    }
    /**
     * Sets the change in position desired for actions done on the selection. In future, these initialXY and finalXY values will be provided by a mousedown and mouseup event listener on the selected and destination tiles. Deltas read from top-leftmost cell of selection.
     */
    setPositionDelta(initialXY, finalXY) {
        this.positionDelta = readPositionDelta(initialXY, finalXY);
    }
    /**
     * Executes a callback function at each element in the selection array. The callback function is given access to all local variables from iteration, in order: currentCell, destinationCell, returnVariable, deltaX, deltaY, i.
     * @param callback A function to execute at each element in the selection.
     * @param returnVariable Optional. A variable which can be modified by the callback function to pass back to the caller.
     * @returns Returns void if no returnVariable is given, or returns whatever is assigned to the returnVariable.
     */
    _iterateOverSelection(callback, returnVariable) {
        let [deltaX, deltaY] = this.positionDelta;
        this.selection.rows.forEach((currentRow, YPosition, selection) => {
            currentRow.columns.forEach((currentCell, XPosition, row) => {
                let [initialX, initialY] = [XPosition, YPosition];
                let [finalX, finalY] = [initialX + deltaX, initialY + deltaY];
                let destinationCell = this.parentGrid.cell([finalX, finalY]);
                callback({
                    initialPosition: [initialX, initialY],
                    finalPosition: [finalX, finalY],
                    currentCell: currentCell,
                    destinationCell: destinationCell,
                });
            });
        });
        if (returnVariable != undefined) {
            return returnVariable;
        }
    }
    batchSelect(cells) {
        for (let i = 0; i < cells.length; i++) {
            this.select(cells[i]);
        }
    }
    /**
     * Adds the Cell at the given XY coordinate into the selection, if it exists.
     * @param XYCoordinate
     */
    select([cellX, cellY]) {
        let cellInParent = this.parentGrid.cell([cellX, cellY]);
        if (this.parentGrid.hasCell([cellX, cellY])) {
            if (this.selection.hasRow(cellY)) {
                this._selectInKnownRow([cellX, cellY], cellInParent);
            }
            else {
                this._selectInNewRow([cellX, cellY], cellInParent);
            }
        }
    }
    _selectInNewRow([cellX, cellY], cellInParent) {
        let newEmptyRow = new Row(0, cellY, this.selection, false);
        this.selection.rows = insertElementInMap(this.selection.rows, cellY, newEmptyRow);
        let newRow = this.selection.row(cellY);
        newRow.set(cellX, cellInParent);
    }
    _selectInKnownRow([cellX, cellY], cellInParent) {
        let knownRow = this.selection.row(cellY);
        if (knownRow.column(cellX) == undefined) {
            knownRow.columns = insertElementInMap(knownRow.columns, cellX, cellInParent);
        }
    }
    /**
     * Remove a cell from the current selection.
     */
    deselect([cellX, cellY]) {
        if (this.selection.hasRow(cellY)) {
            let row = this.selection.row(cellY);
            if (row.hasCell(cellX)) {
                row.columns.delete(cellX);
            }
        }
    }
    /**
     * Moves selected cells to desired location.
     * @see _iterateOverSelection
     */
    move(positionDelta) {
        this.positionDelta = positionDelta;
        this._iterateOverSelection((params) => {
            params.destinationCell.data = params.currentCell.data;
        });
        this.delete();
        this.shift(positionDelta);
    }
    /**
     * Switches selected cells with desired destination cells.
     * @see _iterateOverSelection
     */
    swap(positionDelta) {
        this.positionDelta = positionDelta;
        this._iterateOverSelection((params) => {
            [params.currentCell.data, params.destinationCell.data] = [params.destinationCell.data, params.currentCell.data];
        });
    }
    /**
     * Fills each cell in the selection with the given data.
     * @param data The data with which to fill each cell.
     * @see _iterateOverSelection
     */
    fill(data) {
        this._iterateOverSelection((currentCell) => {
            currentCell.data = data;
        });
    }
    /**
     * Creates a copy of the current selection into the clipboard to be used later.
     */
    copy() {
        this.clipboard = Object.assign({}, this.selection);
    }
    cut() {
        this.copy();
        this.clear();
    }
    /**
     * Places a duplicate of the selection copied into the location selected, relative to the top-leftmost tile in the selection.
     */
    paste(positionDelta) {
        this.positionDelta = positionDelta;
        this._iterateOverSelection((params) => {
        });
    }
    clearClipboard() {
        this.clipboard.rows.clear();
    }
    rotate(center, amount, clockwise) {
    }
    /**
     * Removes the data of each cell in the selection.
     * @see _iterateOverSelection
     */
    delete() {
        this._iterateOverSelection((params) => {
            params.currentCell.data = undefined;
        });
    }
    /**
     * Moves selection to desired destination.
     * @see _iterateOverSelection
     */
    shift(positionDelta) {
        this.positionDelta = positionDelta;
        let selectionDelta = {
            current: [],
            result: []
        };
        selectionDelta = this._iterateOverSelection((params) => {
            selectionDelta.current.push(params.initialPosition);
            selectionDelta.result.push(params.finalPosition);
        }, selectionDelta);
        this.clear();
        for (let i = 0; i < selectionDelta.result.length; i++) {
            let cell = selectionDelta.result[i];
            if (selectionDelta.current.includes(cell) == false) {
                this.select(cell);
            }
        }
    }
    /**
     * Clears the current selection.
     */
    clear() {
        this.selection.rows.clear();
    }
    /**
     * Exports the current selection to a JSON file to be rendered with a Grid renderer.
     */
    export() {
    }
    /**
     * The root cell is the cell which all actions on the selection are done relative to.
     * By default, the root is the top-leftmost cell in the selection, though this can be changed with the direction flag.
     * Top is prioritized; that is, even if a piece is further left than another, the higher one will be returned.
     * @see _iterateOverSelection
     */
    getRootCell(direction = "top-left") {
        let [vertical, horizontal] = direction.split('-');
        let YPosition = this.selection[vertical];
        let row = this.selection.row(YPosition);
        let XPosition = row[horizontal];
        let rootCell = row.column(XPosition);
        return rootCell;
    }
}
/**
 * Sets up a renderer for a grid,
 * capable of creating or modifying html elements on the fly to reflect changes in the data.
 */
class GridRenderer {
    constructor(childGrid, target = document.body, tileset) {
        this.styles = {
            grid: {
                BGColor: 'palegoldenrod',
                borderDefault: '1px dotted lightseagreen'
            },
            selection: {
                BGColor: 'inherit',
                borderEdge: '2px solid lightseagreen'
            }
        };
        this.identifier = childGrid.identifier;
        this.childGrid = childGrid;
        this.tileset = tileset ? tileset : undefined;
        this.createFrame(target);
        this.renderChildGridToHTML();
    }
    createFrame(targetElement) {
        if (document.getElementById("Grid_Renderer_Frame" + this.identifier) == null) {
            let div = document.createElement("div");
            targetElement.appendChild(div).id = "Grid_Renderer_Frame_" + this.identifier;
            this.frame = document.getElementById('Grid_Renderer_Frame_' + this.identifier);
            this.frame.classList.add('grid-renderer-frame');
        }
    }
    renderChildGridToHTML() {
        this.resolveData_DocumentDeltas();
        //setup menus
        //setup listening for changes in grid data
    }
    renderSelection() {
        let selector = this.childGrid.boundSelector;
        selector._iterateOverSelection((opts) => {
            this.renderSelectedCell(opts.initialPosition);
        });
    }
    renderSelectedCell([cellX, cellY]) {
        let currentCell = this.childGrid.cell([cellX, cellY]);
        let HTMLCellReference = getCellReference([cellX, cellY], this.identifier);
        HTMLCellReference.classList.add('selected');
        this.renderAdjacentCellBorders(currentCell, HTMLCellReference);
    }
    renderAdjacentCellBorders(currentCell, HTMLCellReference) {
        let selector = this.childGrid.boundSelector;
        let adjacencies = currentCell.adjacentCells;
        for (let i = 0; i < PerpendicularDirections.length; i++) {
            let direction = PerpendicularDirections[i];
            let adjacentCell = adjacencies[direction];
            let border = HTMLCellReference.style;
            if (adjacentCell != undefined) {
                if (selector.selection.hasCell(adjacentCell.XYCoordinate) == false) {
                    border['border-' + direction] = this.styles.selection.borderEdge;
                }
                else {
                    border['border-' + direction] = this.styles.grid.borderDefault;
                }
            }
            else {
                border['border-' + direction] = this.styles.selection.borderEdge;
            }
        }
    }
    /**
     * Resets grid to be totally deselected. Definitely the most inefficient way to do this. Runs in On^2 time.
     */
    removeSelection() {
        this.childGrid.rows.forEach((row, YPosition, grid) => {
            row.columns.forEach((column, XPosition) => {
                this.deselectCell([XPosition, YPosition]);
            });
        });
    }
    deselectCell([cellX, cellY]) {
        let HTMLCellReference = getCellReference([cellX, cellY], this.identifier);
        HTMLCellReference.classList.remove('selected');
        this.removeCellBorders([cellX, cellY], HTMLCellReference);
    }
    removeCellBorders([cellX, cellY], HTMLCellReference) {
        for (let i = 0; i < PerpendicularDirections.length; i++) {
            let direction = PerpendicularDirections[i];
            HTMLCellReference.style['border-' + direction] = this.styles.grid.borderDefault;
        }
    }
    resolveData_DocumentDeltas() {
        this.checkRowsInDocument();
        this.checkCellsInDocument();
        this.checkRowsInGrid();
    }
    checkRowsInGrid() {
        this.childGrid.rows.forEach((row, YPosition, grid) => {
            if (documentHasRow(YPosition, this.identifier)) {
                this.checkCellsInRowInGrid(row, YPosition);
            }
            else {
                this.addRowToDocument(row, YPosition);
            }
        });
    }
    checkCellsInRowInGrid(row, YPosition) {
        row.columns.forEach((column, XPosition, grid) => {
            if (!documentHasCell([XPosition, YPosition], this.identifier)) {
                this.addCellToDocument([XPosition, YPosition]);
            }
        });
    }
    checkRowsInDocument() {
        let rows = document.getElementsByClassName('grid-row-in-' + this.identifier);
        let removalQueue = [];
        for (let i = 0; i < rows.length; i++) {
            let row = rows.item(i);
            let id = row.id;
            let index = parseInt(id.split(' ')[1]);
            if (this.childGrid.hasRow(index) == false) {
                removalQueue.push(row);
            }
        }
        this.fulfillRowRemovalQueue(removalQueue);
    }
    checkCellsInDocument() {
        let cells = document.getElementsByClassName('grid-cell-in-' + this.identifier);
        let removalQueue = [];
        for (let i = 0; i < cells.length; i++) {
            let cell = cells.item(i);
            let id = cell.id;
            let [itemName, XString, YString] = id.split(' ');
            let [XPosition, YPosition] = [parseInt(XString), parseInt(YString)];
            if (this.childGrid.hasCell([XPosition, YPosition]) == false) {
                removalQueue.push([cell, YPosition]);
            }
        }
        this.fulfillCellRemovalQueue(removalQueue);
    }
    addRowToDocument(row, YPosition) {
        let HTMLRow = document.createElement("div");
        this.frame.appendChild(HTMLRow).id = `row ${YPosition}` + ' ' + this.identifier;
        let HTMLRowReference = getRowReference(YPosition, this.identifier);
        HTMLRowReference.classList.add('grid-row');
        HTMLRowReference.classList.add('grid-row-in-' + this.identifier);
        HTMLRowReference.style.order = `${YPosition}`;
        row.columns.forEach((column, XPosition, row) => {
            if (!documentHasCell([XPosition, YPosition], this.identifier)) {
                this.addCellToDocument([XPosition, YPosition]);
            }
        });
    }
    addCellToDocument([XPosition, YPosition]) {
        let div = document.createElement("div");
        let HTMLRowReference = getRowReference(YPosition, this.identifier);
        HTMLRowReference.appendChild(div).id = `cell ${XPosition} ${YPosition}` + ' ' + this.identifier;
        let HTMLCellReference = getCellReference([XPosition, YPosition], this.identifier);
        HTMLCellReference.classList.add('grid-cell');
        HTMLCellReference.classList.add('grid-cell-in-' + this.identifier);
        HTMLCellReference.style.order = `${XPosition}`;
        HTMLCellReference.style.backgroundColor = this.styles.grid.BGColor;
        HTMLCellReference.style.border = this.styles.grid.borderDefault;
    }
    fulfillRowRemovalQueue(removalQueue) {
        for (let i = 0; i < removalQueue.length; i++) {
            let row = removalQueue[i];
            this.removeRowFromDocument(row);
        }
    }
    fulfillCellRemovalQueue(removalQueue) {
        for (let i = 0; i < removalQueue.length; i++) {
            let cell = removalQueue[i][0];
            let YPosition = removalQueue[i][1];
            this.removeCellFromDocument(cell, YPosition);
        }
    }
    removeRowFromDocument(row) {
        this.frame.removeChild(row);
    }
    removeCellFromDocument(cell, YPosition) {
        let row = getRowReference(YPosition, this.identifier);
        row.removeChild(cell);
    }
    renderGridFromJSON(presetGrid) {
    }
}
class GridController {
    constructor(childGrid, boundRenderer) {
        this.childGrid = childGrid;
        this.boundRenderer = boundRenderer;
    }
    setupKeyboardListeners() {
    }
}
/**
 * Determines whether a number is even.
 * @param n a whole number.
 */
function isEven(n) {
    return n % 2 == 0;
}
/**
 * Makes a number negative.
 */
function negative(n) {
    if (n >= 0) {
        return -n;
    }
    else {
        return n;
    }
}
/**
 * Makes a number positive.
*/
function positive(n) {
    if (n >= 0) {
        return n;
    }
    else {
        return -n;
    }
}
function getRowReference(y, identifier) {
    return document.getElementById(`row ${y}` + ' ' + identifier);
}
function getCellReference([x, y], identifier) {
    return document.getElementById(`cell ${x} ${y}` + ' ' + identifier);
}
function documentHasCell([x, y], identifier) {
    return getCellReference([x, y], identifier) != null;
}
function documentHasRow(y, identifier) {
    return getRowReference(y, identifier) != null;
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
function generateCoordinateAxis(size) {
    let distanceFromOrigin;
    let axis = [];
    if (isEven(size)) {
        size += 1;
    }
    distanceFromOrigin = Math.floor(size / 2);
    for (let i = 0; i < size; i++) {
        axis.push(negative(distanceFromOrigin) + i);
    }
    return axis;
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
 * Measures the distance between two Coordinates.
 * @returns Returns a coordinate pair representing the position delta.
 * @example
 * readPositionDelta([0,4],[3,-2])
 * // Returns [3,-6]
 */
function readPositionDelta([initialX, initialY], [finalX, finalY]) {
    let deltaX = finalX - initialX;
    let deltaY = finalY - initialY;
    return [deltaX, deltaY];
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
/**
 * For an array sorted from negative to positive (or positive to negative if reversed = true), inserts a number
 * in the position where the number on its left is smaller than it, and the number on its right is larger than it.
 * @param map
 */
function insertElementInMap(map, indexToInsert, elementToInsert, reverse = false) {
    let array = [];
    let sortedMap = new Map();
    let comparatorFunction = getSortComparator(reverse);
    array = fillArrayWithMapKeys(array, map);
    array.push(indexToInsert);
    array.sort(comparatorFunction);
    for (let i = 0; i < array.length; i++) {
        let key = array[i];
        if (key == indexToInsert) {
            sortedMap.set(key, elementToInsert);
        }
        else {
            sortedMap.set(key, map.get(key));
        }
    }
    return sortedMap;
}
function getSortComparator(reverse) {
    switch (reverse) {
        case false: return (a, b) => { return a - b; };
        case true: return (a, b) => { return b - a; };
    }
}
function fillArrayWithMapKeys(array, map) {
    map.forEach((value, key, map) => {
        array.push(key);
    });
    return array;
}
function getUniqueIdentifierString() {
    let date = new Date();
    let time = date.getUTCMilliseconds();
    let seed = Math.floor(Math.random() * 10000);
    let identifier = time + seed;
    return identifier.toString();
}
function setupTestGrid() {
    let testGrid = new Grid(15, 15);
    testGrid.boundSelector.batchSelect([
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 2],
        [1, 2],
        [3, 2],
        [-1, 2],
        [-2, -1],
        [4, 4],
        [4, 3],
        [4, 2]
    ]);
    testGrid.boundRenderer.renderChildGridToHTML();
    testGrid.boundRenderer.renderSelection();
    return testGrid;
}
function testShiftSelection([deltaX, deltaY], testGrid) {
    testGrid.boundSelector.shift([deltaX, deltaY]);
    testGrid.boundRenderer.removeSelection();
    testGrid.boundRenderer.renderSelection();
}
