const {app, BrowserWindow} = require('electron');
const path = require("path")

let app_window;

function createWindow() {
    app_window = new BrowserWindow({
        width: 1366,
        height: 768,

        frame: true,
        fullscreen: true,

        show: true,
        resizable: true,

        title: "Tile Editor v2",
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    })    
    app_window.loadFile('index.html')
    app_window.once('ready-to-show', () => {
      app_window.show()
      })
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
        app.quit()
}) 
