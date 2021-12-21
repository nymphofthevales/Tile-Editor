import { Grid } from "./scripts/grid.js"
import { GridSelector } from  "./scripts/selector.js"
import { GridRenderer } from "./scripts/renderer.js"


let g= new Grid(15,15)
let s = new GridSelector(g)
let r = new GridRenderer()
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

