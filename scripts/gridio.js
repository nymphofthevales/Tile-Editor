import { Grid } from "./grid.js";
const fs = require("fs");
export class GridIOManager {
    constructor() {
        this.defaultDataEvaluator = (data) => { return Object.keys(data).length == 0; };
    }
    generateGridFromPreset(preset) {
        let presetGrid = new Grid(preset.w, preset.h, { generateFrom: preset.from });
        preset.cells.forEach((presetCell, index, array) => {
            presetGrid.cell(presetCell.ps).data = presetCell.dt;
        });
        return presetGrid;
    }
    writeGridToPreset(grid, dataEvaluator = this.defaultDataEvaluator) {
        let preset = {
            w: grid.width,
            h: grid.height,
            from: grid.row(grid.bottom).column(grid.left).XYCoordinate,
            cells: []
        };
        grid.forEachCell((cell, grid, preset) => {
            let isEmpty = dataEvaluator(cell.data);
            if (!isEmpty) {
                let cellPreset = {
                    ps: cell.XYCoordinate,
                    dt: cell.data
                };
                preset.cells.push(cellPreset);
            }
            return preset;
        }, preset);
        return preset;
    }
}
