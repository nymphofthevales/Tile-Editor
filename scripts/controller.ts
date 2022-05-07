import { GridRenderer, getCellReference } from "./renderer.js"
import { Grid } from "./grid.js"
import { GridSelector } from "./selector.js"
import { Stack } from "./stack.js"
import { Tileset, Tile } from "./tileset.js"
import { Direction } from "./direction.js"
import { addClassToAllMembers, removeClassFromAllMembers, forEachInClass } from "./dom_helpers.js"
import { DynamicElement } from "./dynamicElement.js"


export class GridController {
    workingGrid: Grid
    workingSelector: GridSelector
    workingRenderer: GridRenderer

    actionManager: ActionManager
    keyboardManager: KeyboardManager
    mouseManager: MouseManager

    ident: string
    
    constructor(w, h, target: HTMLElement = document.body, set: string) {
        this.workingGrid = new Grid(w,h)
        this.workingSelector = new GridSelector(this.workingGrid)

        let tileset = new Tileset(`./tilesets/${set}`)
        this.workingRenderer = new GridRenderer(target, tileset)
        this.ident = this.workingRenderer.identifier

        this.actionManager = new ActionManager(this.workingGrid, this.workingSelector, this.workingRenderer, this.ident)
        this.keyboardManager = new KeyboardManager(this.actionManager)
        this.mouseManager = new MouseManager(this.actionManager)
        this.actionManager.mouseManager = this.mouseManager
    }
    start() {
        this.render()
        this.mouseManager.setupListeners()
        this.keyboardManager.setupListeners()
        this.keyboardManager.zoomManager.setDefaultZoom()
    }
    render() {
        this.workingRenderer.dynamicRender(this.workingGrid, this.workingSelector)
        setTimeout(() => {
            fillTileMenu(this, this.workingRenderer.tileset,"tile-selector-frame")
            this.workingRenderer.renderTileset(this.workingGrid)
        }, 500)
    }
}

export class ActionManager {
    grid: Grid
    selector: GridSelector
    renderer: GridRenderer
    zoomManager: ZoomManager
    mouseManager: MouseManager
    ident: string

    currentActionMode: Function
    selectedTile: string
    expansionAmount: number
    constructor(grid, selector, renderer, ident) {
        this.grid = grid
        this.selector = selector
        this.renderer = renderer
        this.ident = ident

        this.currentActionMode = this.draw_tiles
        this.selectedTile = "none"
        this.expansionAmount = 5

        this.setupExpansionListeners()
    }
    select_deselect([x,y]): void {
        let selector = this.selector
        if (selector.selection.hasCell([x,y])) {
            selector.deselect([x,y])
        } else {
            selector.select([x,y])
        }
    }
    draw_tiles([x,y]): void {
        let cell = this.grid.cell([x,y])
        cell.data.tile = this.selectedTile
        console.log(cell)
        this.renderer.renderTile(cell)
    }
    drag_select([x1,y1], [x2,y2]): void {

    }
    setupExpansionListeners(): void {
        let actionManager = this;
        document.getElementById('expand-top').addEventListener('mouseup', ()=>{
            actionManager.expandGrid('top')
        })
        document.getElementById('expand-right').addEventListener('mouseup', ()=>{
            actionManager.expandGrid('right')
        })
        document.getElementById('expand-bottom').addEventListener('mouseup', ()=>{
            actionManager.expandGrid('bottom')
        })
        document.getElementById('expand-left').addEventListener('mouseup', ()=>{
            actionManager.expandGrid('left')
        })
    }
    expandGrid(direction: Direction): void {
        switch (direction) {
            case "top":
            case "bottom":
                this.grid.increaseHeight(this.expansionAmount, direction)
                break;
            case "left":
            case "right":
                this.grid.increaseWidth(this.expansionAmount, direction)
                break;
        }
        this.renderer.resolveData_DocumentDeltas(this.grid)
        this.zoomManager.setZoom('grid-cell')
        this.mouseManager.setupListeners()
    }
    hideBorders() {
        removeClassFromAllMembers('grid-cell', 'default-cell-border')
    }
    showBorders() {
        addClassToAllMembers('grid-cell', 'default-cell-border')
    }
    selectTile(tileName: string): void {
        this.selectedTile = tileName
        
    }
}


class KeyboardManager  {
    zoomManager: ZoomManager
    actionManager: ActionManager
    constructor(actionManager) {
        this.actionManager = actionManager
        this.zoomManager = new ZoomManager()
        actionManager.zoomManager = this.zoomManager;
    }
    zoomIn() {
        this.zoomManager.zoomIn()
    }
    zoomOut() {
        this.zoomManager.zoomOut()
    }
    setupListeners() {
        window.addEventListener('keyup', (event) => {
            let key = event.key
                switch (key) {
                    case '=':
                    case '+':
                        this.zoomIn()
                        break;
                    case '-':
                    case '_':
                        this.zoomOut()
                        break;
                }
        })
    }
}

class MouseManager{
    mousePosition: Stack
    actionManager: ActionManager
    ident: string
    constructor(actionManager: ActionManager) {
        this.mousePosition = new Stack()
        this.mousePosition["listening"] = false
        this.actionManager = actionManager
        this.ident = this.actionManager.ident
    }
    click() {
        console.log(this.mousePosition._stack)
        let [x,y] = this.mousePosition.latest
        this.actionManager.currentActionMode([x,y])
        this.actionManager.renderer.renderSelection(this.actionManager.selector)
    }
    release() {
        console.log('release', this.mousePosition.latest, this.mousePosition.oldest)
    }
    hover() {
        let [x,y] = this.mousePosition.latest
        console.log('hover', this.mousePosition.latest)
        getCellReference([x,y], this.ident).classList.add('hovered')
    }
    clearHover() {
        let [x,y] = this.mousePosition.oldest
        console.log('clearhover', this.mousePosition.oldest)
        getCellReference([x,y], this.ident).classList.remove('hovered')
    }
   setupListeners() {
        this.actionManager.grid.forEachCell((cell, grid, returnVariable) => {
            let [x,y] = cell.XYCoordinate
            let reference = getCellReference( [x,y], this.ident )
            reference.draggable = false
            reference.addEventListener("pointerenter", () => {
                if (!this.mousePosition['listening']) {
                    this.mousePosition.clear()
                    this.mousePosition.push([x,y])
                    this.hover()
                }
            })
            reference.addEventListener("pointerleave", () => {
                if (!this.mousePosition['listening']) {
                    this.clearHover()
                    this.mousePosition.clear()
                }
            })
            reference.addEventListener("mousedown", (event) => {
                event.preventDefault();
                this.click()
                this.mousePosition['listening'] = true
            })
            reference.addEventListener("mouseup", () => {
                this.mousePosition.push([x,y])
                this.release()
                this.mousePosition['listening'] = false
                this.clearHover()
                this.mousePosition.clear()
                this.mousePosition.push([x,y])
                this.hover()
            })
        })  
    }
    appendCustomCursors() {

    }
}

class ZoomManager {
    zoomSize = 5
    prevZoom = 5
    maxZoom = 20
    minZoom = 1
    constructor(defaultZoom: number = 5, max: number = 20, min: number = 1) {
        this.zoomSize = defaultZoom
        this.prevZoom = defaultZoom
        this.maxZoom = max
        this.minZoom = min
    }
    setDefaultZoom() {
        this.setZoom("grid-row")
        this.setZoom("grid-cell")
    }
    zoomIn() {
        console.log('zoomin')
        if (this.zoomSize != this.maxZoom) {
            this.zoomSize += 1
            this.setZoom("grid-row")
            this.setZoom("grid-cell")
            this.prevZoom += 1
        }
    }
    zoomOut() {
        console.log('zoomout')
        if (this.zoomSize != this.minZoom) {
            this.zoomSize -= 1
            this.setZoom("grid-row")
            this.setZoom("grid-cell")
            this.prevZoom -= 1
        }
    }
    /**
     * Iterates over all elements of a class and applies the appropriate size class.
    */
    setZoom(targetClass: string) {
        let zoomManager = this
        let size = this.zoomSize
        forEachInClass(targetClass, (elem: HTMLElement)=>{
            zoomManager.clearSizeClasses(elem)
            elem.classList.add(`grid-h-${size}`)
            if (!elem.classList.contains("grid-row")) {
                elem.classList.add(`grid-w-${size}`)
            }
        })
    }
    clearSizeClasses(element: Element): void {
        let height = `grid-h-${this.prevZoom}`
        let width = `grid-w-${this.prevZoom}`
        element.classList.remove(height)
        element.classList.remove(width)
    }
}

class ControllerMenu {
    menu: DynamicElement
    tileViewer: DynamicElement

    constructor(menu: HTMLElement) {
        this.menu = new DynamicElement(menu)
        let viewer = document.getElementById('selected-tile-viewer')
        if (viewer) {
            this.tileViewer = new DynamicElement(viewer)
        }

    }
    fillTileMenu(caller: GridController, tileset: Tileset, target: string) {
        console.log(`attempting over ${tileset}`)
        console.log(tileset._tiles)
        tileset.forEachTile((tileName, tile) => {
            let menu = document.getElementById(target)
            let btn = document.createElement("button")
            let label = document.createElement("div")
            let img = document.createElement("img")
            menu.appendChild(btn).id=`tile-selector-${tileName}`
            let button = document.getElementById(`tile-selector-${tileName}`)
            button.classList.add("controller-tile-selector-button")
            button.appendChild(img).src = tile.path
            button.addEventListener('mouseup', ()=>{
                caller.actionManager.selectTile(tileName)
            })
        })
    }
    selectTile() {
        
    }
}

/**
 * Returns "foo bar" from "foo_bar"
*/
function splitFilename(filename) {
    let x = ""
    let a = filename.split('_')
    for (let i=0; i < a.length; i++) {
        x += a[i]
        x = (i != a.length - 1)? x + " " : x
    }
    return x
}
