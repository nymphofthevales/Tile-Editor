import { Grid } from "./scripts/grid.js"
import { GridSelector } from  "./scripts/selector.js"
import { GridRenderer } from "./scripts/renderer.js"


let g= new Grid(20,20)
let s = new GridSelector(g)
let target = document.getElementById('grid-mount')
let r = new GridRenderer(target)
s.batchSelect([
    [0,0],
    [0,1],
    [1,1],
    [2,2],
    [1,2],
    [3,2],
    [-1,2],
    [-2,-1],
    [4,4],
    [4,3],
    [4,2]
])
r.dynamicRender(g, s)

let cells = []
cells = g.forEachCell((cell, grid, cells) => {
    cells.push(cell.XYCoordinate)
    return cells
}, cells)
console.log(cells)

document.getElementById("CTRL-BASIC-MOVE")
document.getElementById("CTRL-BASIC-FILL")
document.getElementById("CTRL-BASIC-COPY")
document.getElementById("CTRL-BASIC-PASTE")
document.getElementById("CTRL-BASIC-DELETE")

document.getElementById("CTRL-SELECTIONMODE-CELL")
document.getElementById("CTRL-SELECTIONMODE-ROW")
document.getElementById("CTRL-SELECTIONMODE-COLUMN")
document.getElementById("CTRL-SELECTIONMODE-AREA")

document.getElementById("CTRL-SELECTION-ADD")
document.getElementById("CTRL-SELECTION-REMOVE")
document.getElementById("CTRL-SELECTION-ADJUST")
document.getElementById("CTRL-SELECTION-ALL")
document.getElementById("CTRL-SELECTION-CLEAR")

document.getElementById("CTRL-GENERAL-UNDO")
document.getElementById("CTRL-GENERAL-REDO")
document.getElementById("CTRL-GENERAL-EXPAND")
document.getElementById("CTRL-GENERAL-SHRINK")
document.getElementById("CTRL-GENERAL-CROP")

