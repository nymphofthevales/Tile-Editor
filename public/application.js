import { Grid } from "./scripts/grid.js";
import { GridSelector } from "./scripts/selector.js";
import { GridRenderer, getCellReference } from "./scripts/renderer.js";
class Stack {
    constructor() {
        this._stack = [];
    }
    constuctor() {
    }
    pop() {
        this._stack.pop();
    }
    push(element) {
        this._stack.push(element);
    }
    clear() {
        this._stack = [];
    }
    get length() {
        return;
    }
    get latest() {
        let index = this._stack.length - 1;
        return this._stack[index];
    }
    get oldest() {
        return this._stack[0];
    }
}
class Form {
    constructor(id) {
        this.inputs = {};
        this.values = {};
        this._housing = document.getElementById(id);
    }
    addInput(name, id) {
        this.inputs[name] = document.getElementById(id);
    }
    read() {
        for (let key in this.inputs) {
            let element = this.inputs[key];
            this.values[key] = element.value;
        }
        return this.values;
    }
    clearInputs() {
        for (let element in this.inputs) {
            this.inputs[element].value = "";
        }
    }
    set submit(id) {
        this._submit = document.getElementById(id);
    }
    set submitAction(callback) {
        this._submit.addEventListener("mouseup", callback);
    }
    set close(id) {
        this._close = document.getElementById(id);
    }
    set closeAction(callback) {
        this._close.addEventListener("mouseup", callback);
    }
}
let actionModes = {
    select_deselect: function ([x, y]) {
        if (workingSelector.selection.hasCell([x, y])) {
            workingSelector.deselect([x, y]);
        }
        else {
            workingSelector.select([x, y]);
        }
    },
    draw_tiles: function ([x, y]) {
    },
    drag_select: function ([x1, y1], [x2, y2]) {
    }
};
let keyboardActions = {
    zoomin: () => {
        console.log('zoomin');
        if (zoomSize != 20) {
            zoomSize += 1;
            adjustZoom("grid-row");
            adjustZoom("grid-cell");
            prevZoom += 1;
        }
    },
    zoomout: () => {
        console.log('zoomout');
        if (zoomSize != 1) {
            zoomSize -= 1;
            adjustZoom("grid-row");
            adjustZoom("grid-cell");
            prevZoom -= 1;
        }
    },
};
function clearSizeClasses(element) {
    let height = `grid-h-${prevZoom}`;
    let width = `grid-w-${prevZoom}`;
    element.classList.remove(height);
    element.classList.remove(width);
}
function adjustZoom(className) {
    let elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
        clearSizeClasses(elements[i]);
        elements[i].classList.add(`grid-h-${zoomSize}`);
        if (className != "grid-row") {
            elements[i].classList.add(`grid-w-${zoomSize}`);
        }
    }
}
let cellInteractions = {
    click: () => {
        console.log(mousePosition._stack);
        let [x, y] = mousePosition.latest;
        currentActionMode([x, y]);
        workingRenderer.renderSelection(workingSelector);
    },
    release: () => {
        console.log('release', mousePosition.latest, mousePosition.oldest);
    },
    hover: () => {
        let [x, y] = mousePosition.latest;
        console.log('hover', mousePosition.latest);
        getCellReference([x, y], ident).classList.add('hovered');
    },
    clearHover: () => {
        let [x, y] = mousePosition.oldest;
        console.log('clearhover', mousePosition.oldest);
        getCellReference([x, y], ident).classList.remove('hovered');
    },
};
let workingGrid;
let workingSelector;
let target = document.getElementById('grid-mount');
let workingRenderer = new GridRenderer(target);
let ident = workingRenderer.identifier;
let editorOpen = false;
let zoomSize = 5;
let prevZoom = 5;
let currentActionMode = actionModes.select_deselect;
let mousePosition = new Stack();
mousePosition['listening'] = false;
let setupForm = new Form("map-setup-frame");
setupForm.addInput("width", "NEWMAP-WIDTH");
setupForm.addInput("height", "NEWMAP-HEIGHT");
setupForm.addInput("tileset", "NEWMAP-TILESET");
setupForm.submit = "NEWMAP-SUBMIT";
setupForm.submitAction = () => {
    let parameters = setupForm.read();
    let w = parseInt(parameters.width);
    let h = parseInt(parameters.height);
    let set = parameters.tileset;
    workingGrid = new Grid(w, h);
    workingSelector = new GridSelector(workingGrid);
    startEditor();
    setupForm.clearInputs();
    setupForm._housing.classList.add("hidden");
};
setupForm.close = "NEWMAP-CLOSE";
setupForm.closeAction = () => {
    setupForm._housing.classList.add("hidden");
    setupForm.clearInputs();
};
function startEditor() {
    editorOpen = true;
    workingRenderer.dynamicRender(workingGrid, workingSelector);
    setupCellListeners();
    setDefaultZoom();
    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("application-frame").classList.remove("hidden");
}
function setDefaultZoom() {
    adjustZoom("grid-row");
    adjustZoom("grid-cell");
}
function setupCellListeners() {
    workingGrid.forEachCell((cell, grid, returnVariable) => {
        let [x, y] = cell.XYCoordinate;
        let identifier = workingRenderer.identifier;
        let reference = getCellReference([x, y], identifier);
        reference.addEventListener("pointerenter", () => {
            if (!mousePosition['listening']) {
                mousePosition.clear();
                mousePosition.push([x, y]);
                cellInteractions.hover();
            }
        });
        reference.addEventListener("pointerleave", () => {
            if (!mousePosition['listening']) {
                cellInteractions.clearHover();
                mousePosition.clear();
            }
        });
        reference.addEventListener("mousedown", () => {
            cellInteractions.click();
            mousePosition['listening'] = true;
        });
        reference.addEventListener("mouseup", () => {
            mousePosition.push([x, y]);
            cellInteractions.release();
            mousePosition['listening'] = false;
            cellInteractions.clearHover();
            mousePosition.clear();
            mousePosition.push([x, y]);
            cellInteractions.hover();
        });
    });
}
window.addEventListener('keyup', (event) => {
    let key = event.key;
    if (editorOpen == true) {
        switch (key) {
            case '=':
            case '+':
                keyboardActions.zoomin();
                break;
            case '-':
            case '_':
                keyboardActions.zoomout();
                break;
        }
    }
});
document.getElementById("MENU-NEW").addEventListener('mouseup', () => {
    setupForm.clearInputs();
    setupForm._housing.classList.remove("hidden");
});
document.getElementById("CTRL-BASIC-MOVE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-FILL").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-COPY").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-PASTE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-BASIC-DELETE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-CELL").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-ROW").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-COLUMN").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTIONMODE-AREA").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-ADD").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-REMOVE").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-ADJUST").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-ALL").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-SELECTION-CLEAR").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-UNDO").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-REDO").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-EXPAND").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-SHRINK").addEventListener('mouseup', () => {
});
document.getElementById("CTRL-GENERAL-CROP").addEventListener('mouseup', () => {
});
