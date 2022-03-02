const path = require( 'path' )
const dir = require('node-dir')

export class Tileset {
    path: string
    tiles: {}
    constructor(path: string) {
        this.path = path
        this.tiles = {}
        this.construct()
    }
    get(tileName) {
        return this.tiles[tileName]
    }
    forEach(callback: Function) {
        for (let tile in this.tiles) {
            callback(tile, this.tiles[tile])
        }
    }
    construct() {
        let parent = this
        dir.readFiles(this.path, {
            match: /.png$/,
            exclude: /^\./
        },
        function(err,content,filename, next) {
            if (err) throw err
            next()
        }, 
        function(err,files) {
            if (err) throw err
            for (let i=0; i < files.length; i++) {
                let filePath = files[i]
                parent.addTile(filePath)
            }
        })
    }
    addTile(filePath) {
        let filename = extractFilename(filePath)
        this.tiles[filename] = new Tile(filePath)
        console.log(this.tiles)
    }
    
}

function extractFilename(filePath) {
    let x = filePath.split('/')
    let filename = x[x.length - 1]
    filename = filename.split('.')[0]
    return filename
}

export class Tile {
    path: string
    /*rotationof: Array<{
        tile: Tile,
        clockwise: boolean
    }>*/
    constructor(filePath) {
        this.path = filePath
    }
}

let labyrinth = new Tileset(path.join(__dirname, "..", "tilesets/labyrinth/passageway"))


/*dir.readFiles(path.join(__dirname, "..", "tilesets/labyrinth/passageway"), {
   match: /.png$/,
    exclude: /^\./
}, function(err, content, next) {
    if (err) throw err
    next()
}, function(err, files) {
    if (err) throw err
    console.log('finished')
    console.log(files)
})*/
