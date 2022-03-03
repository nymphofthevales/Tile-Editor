const path = require('path');
const dir = require('node-dir');
export class Tileset {
    constructor(path) {
        this.path = path;
        this.tiles = {};
        this.construct();
    }
    get(tileName) {
        return this.tiles[tileName];
    }
    /**
     * Runs a callback function over every tile in the set.
     * callback gains access to each tile's name, and it's Tile instance.
     * @example callback(tilename: string, this.tiles[tilename]: Tile)
    * @param callback
    */
    forEachTile(callback) {
        let tiles = Object.keys(this.tiles);
        console.log('ran');
        for (let i = 0; i < tiles.length; i++) {
            let tilename = tiles[i];
            callback(tilename, this.tiles[tilename]);
            console.log(`running on ${tilename}`);
        }
    }
    construct() {
        let parent = this;
        dir.readFiles(this.path, {
            match: /.png$/,
            exclude: /^\./
        }, function (err, content, filename, next) {
            if (err)
                throw err;
            next();
        }, function (err, files) {
            if (err)
                throw err;
            for (let i = 0; i < files.length; i++) {
                let filePath = files[i];
                parent.addTile(filePath);
            }
        });
    }
    addTile(filePath) {
        let filename = extractFilename(filePath);
        this.tiles[filename] = new Tile(filePath);
    }
}
function extractFilename(filePath) {
    let x = filePath.split('/');
    let filename = x[x.length - 1];
    filename = filename.split('.')[0];
    return filename;
}
export class Tile {
    /*rotationof: Array<{
        tile: Tile,
        clockwise: boolean
    }>*/
    constructor(filePath) {
        this.path = "./" + filePath;
    }
}
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
