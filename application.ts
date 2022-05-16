

import { GridController } from "./scripts/controller.js"
import { 
    fillTilesetsMenu, 
    fillSavesMenu, 
    startFromNew, 
    startFromLoad, 
    saveCurrentMap,
    addToCurrentMap,
    endEditor,
    setAddFormDirection,
    appendCellData
}  from "./scripts/menu_functions.js"
import { 
    setupForm, 
    loadForm, 
    saveForm, 
    addForm,
    nukeForm,
    optsForm,
    dataForm
} from "./scripts/application_forms.js"

let controller: GridController

function listen(elementID: string, event: keyof HTMLElementEventMap, action: ()=>any) {
    document.getElementById(elementID).addEventListener(event, action)
}

setupForm.onSubmit = () => { controller = startFromNew(setupForm, controller) }
setupForm.onClose   = () => { setupForm.hide() }

loadForm.onSubmit  = () => { controller = startFromLoad(loadForm, controller) }
loadForm.onClose    = () => { loadForm.hide() }

saveForm.onSubmit  = () => { saveCurrentMap(saveForm, controller) }
saveForm.onClose    = () => { saveForm.hide() }

addForm.onSubmit   = () => { addToCurrentMap(addForm, controller) }
addForm.onClose     = () => { addForm.hide() }
listen("DIRECTION-TOP", "mouseup", () => { setAddFormDirection(addForm, "top") })
listen("DIRECTION-RIGHT", "mouseup", () => { setAddFormDirection(addForm, "right") })
listen("DIRECTION-BOTTOM", "mouseup", () => { setAddFormDirection(addForm, "bottom") })
listen("DIRECTION-LEFT", "mouseup", () => { setAddFormDirection(addForm, "left") })

nukeForm.onSubmit  = () => { controller.clearSession() }
nukeForm.onClose    = () => { nukeForm.hide() }

optsForm.onClose     = () => { optsForm.hide() }
let colorSheet = <HTMLLinkElement>document.getElementById("color-palette")
listen("STYLE-DARK", "mouseup", () => { colorSheet.href = "./styles/darkmode.css" })
listen("STYLE-LIGHT", "mouseup", () => { colorSheet.href = "./styles/lightmode.css"  })

dataForm.onSubmit  = () => { appendCellData(dataForm, controller) }
dataForm.onClose    = () => { dataForm.hide() }


listen("MENU-NEW", "mouseup", () => { fillTilesetsMenu(); setupForm.show() })
listen("MENU-LOAD", 'mouseup', () => { fillSavesMenu("LOADMAP-SELECTOR"); loadForm.show(); })
listen("MENU-OPTIONS", "mouseup", () => { optsForm.show() })

listen("CTRL-NAV-SAVE", 'mouseup', () => { saveForm.show(); })
listen("CTRL-NAV-OPTIONS", 'mouseup', () => { optsForm.show() })
listen("CTRL-NAV-QUIT",'mouseup', () => { endEditor(controller) })

listen("ACTION-CROP", 'mouseup', () => { controller.cropWorkspace() })
listen("ACTION-ADD", 'mouseup', () => { fillSavesMenu("ADDMAP-SELECTOR"); addForm.show(); })
listen("ACTION-CLEAR", 'mouseup', () => { nukeForm.show() })

