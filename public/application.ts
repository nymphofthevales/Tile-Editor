import { Grid } from "./scripts/grid.js"
import { GridSelector } from  "./scripts/selector.js"
import { GridRenderer, getCellReference } from "./scripts/renderer.js"

let actionModes = {
    select_deselect: function([x,y]) {
        if (workingSelector.selection.hasCell([x,y])) {
            workingSelector.deselect([x,y])
        } else {
            workingSelector.select([x,y])
        }
    },
    place_tile: function([x,y]) {

    }
}

let workingGrid: Grid
let workingSelector: GridSelector
let target = document.getElementById('grid-mount')
let workingRenderer = new GridRenderer(target)

let currentActionMode = actionModes.select_deselect

class Form {
    _housing: HTMLElement
    inputs = {}
    values = {}
    _submit: HTMLElement
    _close: HTMLElement
    constructor(id: string) {
        this._housing = document.getElementById(id)
    }
    addInput(name:string, id: string): void {
        this.inputs[name] = document.getElementById(id)
    }
    read(): any {
        for (let key in this.inputs) {
            let element = this.inputs[key]
            this.values[key] = element.value
        }
        return this.values
    }
    clearInputs() {
        for (let element in this.inputs) {
            this.inputs[element].value = ""
        }
    }
    set submit(id) {
        this._submit = document.getElementById(id)
    }
    set submitAction(callback: EventListenerOrEventListenerObject) {
        this._submit.addEventListener("mouseup", callback)
    }
    set close(id) {
        this._close = document.getElementById(id)
    }
    set closeAction(callback: EventListenerOrEventListenerObject) {
        this._close.addEventListener("mouseup", callback) 
    }
}
let setupForm = new Form("map-setup-frame")
setupForm.addInput("width", "NEWMAP-WIDTH")
setupForm.addInput("height", "NEWMAP-HEIGHT")
setupForm.addInput("tileset", "NEWMAP-TILESET")
setupForm.submit = "NEWMAP-SUBMIT"
setupForm.submitAction = () => {
    let parameters = setupForm.read()
    let w = parseInt(parameters.width)
    let h = parseInt(parameters.height)
    let set = parameters.tileset
    workingGrid = new Grid(w, h)
    workingSelector = new GridSelector(workingGrid)
    startEditor()
    setupForm.clearInputs()
    setupForm._housing.classList.add("hidden")
}
setupForm.close = "NEWMAP-CLOSE"
setupForm.closeAction = () => {
    setupForm._housing.classList.add("hidden")
    setupForm.clearInputs()
}


function startEditor() {
    workingRenderer.dynamicRender(workingGrid, workingSelector)
    setupCellListeners()
    document.getElementById("main-menu").classList.add("hidden")
    document.getElementById("application-frame").classList.remove("hidden")
}

function setupCellListeners() {
    workingGrid.forEachCell((cell, grid, returnVariable) => {
        let [x,y] = cell.XYCoordinate
        let identifier = workingRenderer.identifier
        let reference = getCellReference( [x,y], identifier )
        reference.addEventListener("mouseup", () => {
            clickCell([x,y])
        })
        reference.addEventListener("hover", () => {
            //hoverCell([x,y])
        })
    })  
}


function clickCell([x,y]) {
    currentActionMode([x,y])
    workingRenderer.renderSelection(workingSelector)
}

document.getElementById("MENU-NEW").addEventListener('mouseup', ()=>{
    setupForm.clearInputs()
    setupForm._housing.classList.remove("hidden")
})

document.getElementById("CTRL-BASIC-MOVE").addEventListener('mouseup', () => {

})
document.getElementById("CTRL-BASIC-FILL").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-BASIC-COPY").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-BASIC-PASTE").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-BASIC-DELETE").addEventListener('mouseup', () => {
    
})

document.getElementById("CTRL-SELECTIONMODE-CELL").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-SELECTIONMODE-ROW").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-SELECTIONMODE-COLUMN").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-SELECTIONMODE-AREA").addEventListener('mouseup', () => {
    
})

document.getElementById("CTRL-SELECTION-ADD").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-SELECTION-REMOVE").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-SELECTION-ADJUST").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-SELECTION-ALL").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-SELECTION-CLEAR").addEventListener('mouseup', () => {
    
})

document.getElementById("CTRL-GENERAL-UNDO").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-GENERAL-REDO").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-GENERAL-EXPAND").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-GENERAL-SHRINK").addEventListener('mouseup', () => {
    
})
document.getElementById("CTRL-GENERAL-CROP").addEventListener('mouseup', () => {
    
})

