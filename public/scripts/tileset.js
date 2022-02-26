export class Tileset {
    constructor(path) {
    }
    set title(title) {
        this._title = title;
    }
    get(tileString) {
        var _a;
        return (_a = this.images["tilestring"]) === null || _a === void 0 ? void 0 : _a.url;
    }
    /**
     *
     * @param path a relative file path to a folder of images to be designated as a tileset.
     */
    createTileset(path) {
    }
    /**
     * @param path a relative file path to a JSON tileset file.
     */
    read(path) {
    }
    /**
     * Writes the tileset to a json file.
     */
    write() {
        let tileset = {};
        tileset["title"] = this._title;
        tileset["images"] = this.images;
        JSON.stringify(tileset);
    }
}
