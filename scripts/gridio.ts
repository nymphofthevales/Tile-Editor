import { Grid, Row, Cell } from "./grid.js"
import { Coordinate } from "./coordinate.js"
const fs = require("fs")

export interface GridPreset {
    w: number,
    h: number,
    from: Coordinate
    cells: Array<{
        ps: Coordinate,
        dt: any
    }>
}

export interface MapSave {
    tileset: string,
    grid: GridPreset
}

export class GridIOManager {
    defaultDataEvaluator = (data) => {return Object.keys(data).length == 0}
    generateGridFromPreset(preset: GridPreset): Grid {
        let presetGrid = new Grid(preset.w, preset.h, {generateFrom:preset.from})
        preset.cells.forEach((presetCell, index, array) => {
            presetGrid.cell(presetCell.ps).data = presetCell.dt
        })
        return presetGrid
    }
    writeGridToPreset(grid: Grid, dataEvaluator: (data:object)=>boolean = this.defaultDataEvaluator): GridPreset {
        let preset = {
            w: grid.width,
            h: grid.height,
            from: grid.row(grid.bottom).column(grid.left).XYCoordinate,
            cells: []
        }
        grid.forEachCell((cell, grid, preset)=>{
            let isEmpty = dataEvaluator(cell.data)
            if (!isEmpty) {
                let cellPreset = {
                    ps: cell.XYCoordinate,
                    dt: cell.data
                }
                preset.cells.push(cellPreset)
            }
            return preset
        }, preset)
        return preset
    }
}
