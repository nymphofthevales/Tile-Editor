import { Grid, Row, Cell } from "./grid.js"
import { Coordinate } from "./coordinate.js"
const fs = require("fs")

export interface GridPreset {
    width: number,
    height: number,
    generate_from: Coordinate
    cells: Array<{
        position: Coordinate,
        data: any
    }>
}

export interface MapSave {
    tileset: string,
    grid: GridPreset
}

export class GridIOManager {
    defaultDataEvaluator = (data) => {return Object.keys(data).length == 0}
    generateGridFromPreset(preset: GridPreset): Grid {
        let presetGrid = new Grid(preset.width, preset.height, {generateFrom:preset.generate_from})
        preset.cells.forEach((presetCell, index, array) => {
            presetGrid.cell(presetCell.position).data = presetCell.data
        })
        return presetGrid
    }
    writeGridToPreset(grid: Grid, dataEvaluator: (data:object)=>boolean = this.defaultDataEvaluator): GridPreset {
        let preset = {
            width: grid.width,
            height: grid.height,
            generate_from: grid.row(grid.bottom).column(grid.left).XYCoordinate,
            cells: []
        }
        grid.forEachCell((cell, grid, preset)=>{
            let isEmpty = dataEvaluator(cell.data)
            if (!isEmpty) {
                let cellPreset = {
                    position: cell.XYCoordinate,
                    data: cell.data
                }
                preset.cells.push(cellPreset)
            }
            return preset
        }, preset)
        return preset
    }
}
