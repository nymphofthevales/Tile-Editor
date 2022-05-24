const fs = require('fs');
/**
 * Returns ["DIR", "NAME", "EXTENSION"] from ./foo/DIR/NAME.EXTENSION
*/
function splitFilePath(filePath) {
    console.log(`path at split: ${filePath}`);
    let x = filePath.split('/');
    let directory = x[x.length - 2];
    let filename = x[x.length - 1];
    let y = filename.split('.');
    let file = y[0];
    let extension = y[1];
    console.log(`dir: ${directory} name: ${file} ext: ${extension}`);
    return [directory, file, extension];
}
/**
 * Gets DIR from ./foo/DIR/name.extension
*/
export function extractDirectory(filePath) {
    return splitFilePath(filePath)[0];
}
/**
 * Gets NAME from ./foo/NAME.extension
 */
export function extractFilename(filePath) {
    return splitFilePath(filePath)[1];
}
/**
 * Gets EXTENSION from ./foo/dir/name.EXTENSION
*/
export function extractExtension(filePath) {
    return splitFilePath(filePath)[2];
}
/**
 * Runs a callback function on each filename in directory. Callback is given (directoryPath, filename) for each file.
*/
function iterateOnFiles(directoryPath, callback) {
    let files = fs.readdirSync(directoryPath);
    for (let i = 0; i < files.length; i++) {
        callback(directoryPath, files[i]);
    }
}
/**
 * See iterateOnFiles. Runs a callback the name of each image file in a directory.
*/
export function iterateOnImageFiles(directoryPath, callback) {
    iterateOnFiles(directoryPath, function (path, filename) {
        if (isImage(filename)) {
            callback(path, filename);
        }
    });
}
function isDotfile(filePath) {
    let filename = extractFilename(filePath);
    if (filename.charAt(0) == '.') {
        return true;
    }
    return false;
}
function isImage(filePath) {
    let ext = extractExtension(filePath);
    return isPng(ext) || isJpg(ext);
}
function isPng(ext) {
    if (ext == "png" || ext == "PNG") {
        return true;
    }
    return false;
}
function isJpg(ext) {
    if (ext == "jpg" || ext == "JPG" || ext == "jpeg" || ext == "JPEG") {
        return true;
    }
    return false;
}
