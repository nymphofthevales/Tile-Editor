const path = require( 'path' )
const fs = require('fs')
import { extractFilename, iterateOnImageFiles } from './file_helpers.js'
import { RotationGroup } from './RotationGroup.js'

export class Tileset {
    _path: string
    _tiles: object
    
    constructor(path: string) {
        this._path = path
        this._tiles = {}
        this.construct()
    }
    get(tileName: string): Tile {
        return this._tiles[tileName]
    }
    getMultiple(tileNames: Array<string>): Array<Tile> {
        let tiles = []
        for (let i=0; i< tileNames.length; i++) {
            tiles.push( this.get(tileNames[i]) )
        }
        return tiles
    }
    /**
     * Runs a callback function over every tile in the set.
     * callback gains access to each tile's name, and its Tile instance.
     * @example callback(tilename: string, this.tiles[tilename]: Tile)
    * @param callback 
    */
    forEachTile(callback: Function): void {
        let tiles = Object.keys(this._tiles)
        console.log('ran')
        for (let i=0; i < tiles.length; i++) {
            let tilename = tiles[i]
            callback(tilename, this._tiles[tilename])
            console.log(`running on ${tilename}`)
        }
    }
    construct() {
        let parent = this
        console.log(`tileset path: ${this._path}`)
        iterateOnImageFiles(this._path, function(path, filename) {
            let filePath = path + '/' + filename
            parent.addTile(filePath)
        })
        
    }
    addTile(filePath) {
        let filename = extractFilename(filePath)
        this._tiles[filename] = new Tile(filePath)
        console.log(`${filename}: ${this._tiles[filename].path}`)
    }
    
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