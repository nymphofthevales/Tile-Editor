
import { Direction, AdjacentDirection, Directions, PerpendicularDirections } from "./direction.js"
import { Coordinate, CoordinateAxis } from "./coordinate.js"
import { getUniqueIdentifier } from "./numerical_helpers.js"
import { Grid, Row, Cell, generateGridFromPreset, GridPreset } from "./grid.js"
import { GridSelector } from "./selector.js"
import { Tileset } from "./tileset.js"

/**
 * Sets up a renderer for a grid, 
 * capable of creating or modifying html elements on the fly to reflect changes in the data.
 */
export class GridRenderer {
    tileset: Tileset
    frame: HTMLElement
    identifier: string
    styles = {
        grid: {
            BGColor: 'black',
            borderDefault: '1px dotted white'
        },
        selection: {
            BGColor: 'inherit',//'#a0dba3;'
            borderEdge: '2px solid white'
        }
    }
    constructor(target: HTMLElement = document.body, tileset?: Tileset) {
        this.identifier = getUniqueIdentifier().toString()
        this.tileset = tileset? tileset : undefined
        this.createFrame(target)
    }
    createFrame(targetElement: HTMLElement): void {
        if (document.getElementById("Grid_Renderer_Frame" + this.identifier) == null) {
            let div = document.createElement("div")
            targetElement.appendChild(div).id = "Grid_Renderer_Frame_" + this.identifier
            this.frame = document.getElementById('Grid_Renderer_Frame_' + this.identifier)
            this.frame.classList.add('grid-renderer-frame')
        }
    }
    staticRenderPreset(preset: GridPreset) {
        let grid = generateGridFromPreset(preset)
        this.staticRender(grid)
    }
    staticRender(grid: Grid) {

    }
    dynamicRender(grid: Grid, gridSelector: GridSelector) {
        this.resolveData_DocumentDeltas(grid)
        this.renderSelection(gridSelector)
    }
    resolveSelection_DocumentDeltas(selector: GridSelector): void {
        let selectedCells = document.getElementsByClassName("selected")
        let toRemove = []
        for (let i=0; i < selectedCells.length; i++) {
            let [x,y] = getCoordsFromCellReference(selectedCells[i].id)
            if (!selector.selection.hasCell([x,y])) {
                toRemove.push(selectedCells[i])
            }
        }
        for (let i = 0; i< toRemove.length; i++) {
            toRemove[i].classList.remove("selected")
        }
    }
    renderSelection(selector: GridSelector): void {
        let grid = selector.childGrid
        this.resolveSelection_DocumentDeltas(selector)
        selector._iterateOverSelection((opts) => {
            this.renderCellSelection(grid, selector, opts.initialPosition)
        })
    }
    renderCellSelection( grid: Grid, selector: GridSelector, [cellX, cellY]: Coordinate): void {
        let currentCell = grid.cell([cellX, cellY])
        let HTMLCellReference = getCellReference([cellX, cellY], this.identifier)
        HTMLCellReference.classList.add('selected')
        //this.renderAdjacentCellBorders(grid, selector, currentCell, HTMLCellReference)
    }
    renderAdjacentCellBorders(grid: Grid, selector: GridSelector, currentCell: Cell, HTMLCellReference: HTMLElement): void {
        let adjacencies = currentCell.adjacentCells
        for (let i = 0; i < PerpendicularDirections.length; i++) {
            let direction = PerpendicularDirections[i]
            let adjacentCell= adjacencies[direction]
            let border = HTMLCellReference.style
            if (adjacentCell != undefined) {
                if (selector.selection.hasCell(adjacentCell.XYCoordinate) == false) {
                    border['border-' + direction] = this.styles.selection.borderEdge
                } else {
                    border['border-' + direction] = this.styles.grid.borderDefault
                }
            } else {
                border['border-' + direction] = this.styles.selection.borderEdge
            }
        }
    }
    /**
     * Takes in a user-defined callback function for extracting tileset keys from cell data.
     * @param parser a callback function which extracts and returns a tile string from the cell data.
     * tile string should be a valid key for the tileset.json assigned to the renderer.
     * If no parser is specified, tries to look at cellData['tile'] for a result.
    */
    renderTileset(grid: Grid, parser?: Function) {
        if (parser == undefined) {
            parser = (cellData) => {
                return cellData.tile
            }
        }
        grid.forEachCell((cell, grid) => {
            let data = cell.data 
            let tile: string = parser(data)
            if (tile != undefined) {
                let HTMLCellReference = getCellReference(cell.XYCoordinate, grid.identifier)
               let img //= this.tileset.get(tile)
                HTMLCellReference.style.backgroundImage = img
            }
        })
    }
    /**
     * Resets grid to be totally deselected. 
     */
    removeSelection(selector: GridSelector): void {
        let renderer = this
        selector.selection.forEachCell((cell, grid, renderer) => {
            renderer.deselectCell(cell.XYCoordinate)
        })

    }
    deselectCell([cellX, cellY]: Coordinate): void {
        let HTMLCellReference = getCellReference([cellX, cellY], this.identifier)
        HTMLCellReference.classList.remove('selected')
        //this.removeCellBorders([cellX, cellY], HTMLCellReference)
    }
    removeCellBorders([cellX, cellY]: Coordinate, HTMLCellReference: HTMLElement): void {
        for (let i = 0; i < PerpendicularDirections.length; i++) {
            let direction = PerpendicularDirections[i]
            HTMLCellReference.style['border-' + direction] = this.styles.grid.borderDefault
        }
    }
    resolveData_DocumentDeltas(grid: Grid) {
        this.checkRowsInDocument(grid)
        this.checkCellsInDocument(grid)
        this.checkRowsInGrid(grid)
    }
    checkRowsInGrid(grid: Grid) {
        grid.rows.forEach((row,YPosition) => {
            if (documentHasRow(YPosition,this.identifier)) {
                this.checkCellsInRowInGrid(row,YPosition)
            } else {
                this.addRowToDocument(row,YPosition)
            } 
        })
    }
    checkCellsInRowInGrid(row,YPosition) {
        row.columns.forEach((column,XPosition,grid) => {
            if (!documentHasCell([XPosition,YPosition], this.identifier)) {
                this.addCellToDocument([XPosition,YPosition])
            }
        })
    }
    checkRowsInDocument(grid: Grid) {
        let rows = document.getElementsByClassName('grid-row-in-' + this.identifier)
        let removalQueue: Array<Node> = []
        for (let i=0; i < rows.length; i++) {
            let row = rows.item(i)
            let id = row.id
            let index = parseInt(id.split(' ')[1])
            if (grid.hasRow(index) == false) {
                removalQueue.push(row)
            }
        }
        this.fulfillRowRemovalQueue(removalQueue)
    }
    checkCellsInDocument(grid: Grid) {
        let cells = document.getElementsByClassName('grid-cell-in-' + this.identifier)
        let removalQueue: Array<[Node,number]> = []
        for (let i = 0; i < cells.length; i++) {
            let cell = cells.item(i)
            let id = cell.id
            let [itemName, XString, YString] = id.split(' ')
            let [XPosition, YPosition] = [parseInt(XString), parseInt(YString)]
            if (grid.hasCell([XPosition, YPosition]) == false) {
                removalQueue.push([cell,YPosition])
            }
        }
        this.fulfillCellRemovalQueue(removalQueue)
    }
    addRowToDocument(row,YPosition) {
        let HTMLRow = document.createElement("div")
        this.frame.appendChild(HTMLRow).id = `row ${YPosition}` + ' ' + this.identifier
        let HTMLRowReference = getRowReference(YPosition, this.identifier)
        HTMLRowReference.classList.add('grid-row')
        HTMLRowReference.classList.add('grid-row-in-' + this.identifier)
        HTMLRowReference.style.order = `${YPosition}`
        row.columns.forEach((column, XPosition, row) => {
            if (!documentHasCell([XPosition, YPosition], this.identifier)) {
                this.addCellToDocument([XPosition,YPosition])
            }
        })
    }
    addCellToDocument([XPosition, YPosition]: Coordinate) {
        let div = document.createElement("div")
        let HTMLRowReference = getRowReference(YPosition, this.identifier)
        HTMLRowReference.appendChild(div).id = `cell ${XPosition} ${YPosition}` + ' ' + this.identifier
        let HTMLCellReference = getCellReference([XPosition, YPosition], this.identifier)
        HTMLCellReference.classList.add('grid-cell')
        HTMLCellReference.classList.add('grid-cell-in-' + this.identifier)
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
        let row = getRowReference(YPosition, this.identifier)
        row.removeChild(cell)
    }
}

function getRowReference(y: number, identifier: string) {
    return document.getElementById(`row ${y}` + ' ' + identifier)
}
export function getCellReference([x,y]:Coordinate, identifier: string) {
    return document.getElementById(`cell ${x} ${y}` + ' ' + identifier)
}
function documentHasCell([x,y]: Coordinate, identifier: string): boolean {
    return getCellReference([x,y], identifier) != null
}
function documentHasRow(y: number, identifier: string): boolean {
    return getRowReference(y, identifier)!= null
}
function getCoordsFromCellReference(id: string): Array<number> {
    let [cell, xCoord, yCoord, identifier] = id.split(" ")
    let x = parseInt(xCoord)
    let y = parseInt(yCoord)
    return [x,y]
}

function testShiftSelection([deltaX, deltaY], testGrid) {
    let s = new GridSelector(testGrid)
    let r = new GridRenderer()
    s.shift([deltaX, deltaY])
    r.removeSelection(testGrid)
    testGrid.boundRenderer.renderSelection()
}

