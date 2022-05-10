const path = require( 'path' )
const fs = require('fs')
import { RotationDirection2D } from './direction.js'
import { extractFilename, iterateOnImageFiles } from './file_helpers.js'
import { RotationGroup } from './RotationGroup.js'

export class Tileset {
    name: string
    _path: string
    _tiles: Map<string, Tile>
    rotationGroups: Map<string, RotationGroup>
    constructor(path: string) {
        this._path = path
        this._tiles = new Map()
        this.rotationGroups = new Map()
        this.construct()
        this.readSpecifications()
    }
    get(tileName: string): Tile {
        return this._tiles.get(tileName)
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
     * @example callback(tilename: string, this._tiles.get(tilename): Tile)
    * @param callback 
    */
    forEachTile(callback: Function, returnVariable: any): void | any {
        let tileNames = Array.from(this._tiles.keys())
        for (let i=0; i < tileNames.length; i++) {
            let tilename = tileNames[i]
            callback(tilename, this._tiles.get(tilename), returnVariable)
        }
        if (returnVariable != undefined) {
            return returnVariable
        }
    }
    construct(): void {
        let parent = this
        console.log(`tileset path: ${this._path}`)
        iterateOnImageFiles(this._path, function(path, filename) {
            let filePath = path + '/' + filename
            parent.addTile(filePath)
        })
    }
    addTile(filePath): void {
        let filename = extractFilename(filePath)
        this._tiles.set(filename, new Tile(filePath))
    }
    readSpecifications(): void {
        let path = this._path + '/' + 'specifications.json';
        fs.readFile(path, 'utf8', (err, data)=>{
            if (err) {
                this.name = "Untitled Tileset"
            } else {
                let specifications = JSON.parse(data);
                console.log(specifications)
                this.name = specifications.name
                for (let i=0; i < specifications.rotation_groups.length; i++) {
                    let group: Array<string> = specifications.rotation_groups[i].group
                    let groupName = specifications.rotation_groups[i].name
                    this.setupRotationGroup(group, groupName);
                }
            }
        })
    }
    /**
     * 
    */
    setupRotationGroup(tileNames: Array<string>, groupName: string): void {
        let tiles = this.getMultiple(tileNames)
        for (let i=0; i < tiles.length; i++) {
            let tile = tiles[i]
            if (!tile) {
                throw new Error(`Invalid tile name ${tileNames[i]} at ${groupName}. Check tileset specifications.`)
            }
            tile.rotationGroup = groupName
        }
        this.rotationGroups.set( groupName, new RotationGroup(tiles) )
    }
    rotate(tile: Tile, direction: RotationDirection2D = "clockwise") {
        let rotationGroup = this.rotationGroups.get(tile.rotationGroup)
        if (rotationGroup) {
            return rotationGroup.rotate(tile, direction)
        }
        return tile
    }
}

export class Tile {
    path: string
    name: string
    rotationGroup: string
    constructor(filePath) {
        this.path = filePath
        this.name = extractFilename(filePath)
        this.rotationGroup = undefined;
    }
}