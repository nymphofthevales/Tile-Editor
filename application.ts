import { Form } from "./scripts/form.js"
import { GridController } from "./scripts/controller.js"
import { DynamicElement } from "./scripts/dynamicElement.js"

let controller: GridController
let main_menu = new DynamicElement(document.getElementById("main-menu"))
let application = new DynamicElement(document.getElementById("application-frame"))
let setupForm = new Form("map-setup-frame")
setupForm.addInput("width", "NEWMAP-WIDTH")
setupForm.addInput("height", "NEWMAP-HEIGHT")
setupForm.addInput("tileset", "NEWMAP-TILESET")
setupForm.submitInput = "NEWMAP-SUBMIT"
setupForm.onSubmit = () => {
    let target = document.getElementById('grid-mount')
    let {width, height, tileset} =  setupForm.read()
    width = parseInt(width)
    height = parseInt(height)
    controller = new GridController(width, height, target, tileset)
    startEditor()
    setupForm.clearInputs()
    setupForm.hide()
}
setupForm.closeInput = "NEWMAP-CLOSE"
setupForm.onClose = () => {
    setupForm.hide()
    setupForm.clearInputs()
}

function startEditor() {
    controller.start()
    main_menu.hide()
    application.show()
}

document.getElementById("MENU-NEW").addEventListener('mouseup', ()=>{
    setupForm.clearInputs()
    setupForm.show()
})
