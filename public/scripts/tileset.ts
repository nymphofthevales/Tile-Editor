export class Tileset {
    _title: string
    images: { key: {url: string} }
    constructor(path: string) {

    }
    set title(title) {
        this._title = title
    }
    get(tileString) {
        return this.images["tilestring"]?.url
    }
    /**
     * 
     * @param path a relative file path to a folder of images to be designated as a tileset.
     */
    createTileset(path: string) {
        
    }
    /**
     * @param path a relative file path to a JSON tileset file.
     */
    read(path: string) {

    }
    /**
     * Writes the tileset to a json file.
     */
    write() {
        let tileset = {}
        tileset["title"] = this._title
        tileset["images"] = this.images
        JSON.stringify(tileset)
    }
}