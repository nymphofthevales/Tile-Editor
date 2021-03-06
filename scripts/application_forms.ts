import { Form } from "./form.js"

export const setupForm = new Form("map-setup-frame")
setupForm.addInput("width", "NEWMAP-WIDTH")
setupForm.addInput("height", "NEWMAP-HEIGHT")
setupForm.addInput("tileset", "NEWMAP-TILESET")
setupForm.submitInput = "NEWMAP-SUBMIT"
setupForm.closeInput = "NEWMAP-CLOSE"

export const loadForm = new Form("map-load-frame")
loadForm.addInput("presetName", "LOADMAP-SELECTOR")
loadForm.submitInput = "LOADMAP-SUBMIT"
loadForm.closeInput = "LOADMAP-CLOSE"

export const saveForm = new Form("map-save-frame")
saveForm.addInput("filename", "SAVE-FILENAME")
saveForm.addInput("crop", "SAVE-CROP")
saveForm.submitInput = "SAVE-SUBMIT"
saveForm.closeInput = "SAVE-CLOSE"

export const addForm = new Form("map-add-frame")
addForm.addInput("mapName", "ADDMAP-SELECTOR")
addForm.addInput("crop", "ADDMAP-CROP")
addForm.addInput("direction", "ADDMAP-DIRECTION")
addForm.submitInput = "ADDMAP-SUBMIT"
addForm.closeInput = "ADDMAP-CLOSE"

export const dataForm= new Form("map-data-frame")
dataForm.addInput("data", "DATA-ENTRY-INPUT")
dataForm.submitInput = "DATA-CONFIRM"
dataForm.closeInput = "DATA-CLOSE"

export const nukeForm = new Form("map-nuke-frame")
nukeForm.submitInput = "NUKE-SUBMIT"
nukeForm.closeInput = "NUKE-CLOSE"

export const optsForm = new Form("map-options-frame")
optsForm.closeInput = "OPTS-CLOSE"