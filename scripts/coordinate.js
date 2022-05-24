import { absNegative } from './numerical_helpers.js';
/**
 * Generates an array of numbers representing labels on a coordinate axis.
 * For even width axes, 0 will be placed to the right. See examples.
 * @param size the desired total size of the axis.
 * @returns Returns an array with a length equal to size.
 * @example
 * generateCoordinateAxis(5)
 * // Returns [-2,-1,0,1,2]
 * @example
 * generateCoordinateAxis(2)
 * // Returns [-1,0]
 * @example
 * generateCoordinateAxis(10)
 * // Returns [-5,-4,-3,-2,-1,0,1,2,3,4]
 * @example
 * generateCoordinateAxis(1)
 * // Returns [0]
 * @example
 * generateCoordinateAxis(0)
 * // Returns []
 */
export function generateCoordinateAxis(size, from) {
    let distanceFromOrigin;
    let axis = [];
    if (size != 0) {
        if (from != undefined) {
            distanceFromOrigin = absNegative(from);
        }
        else {
            distanceFromOrigin = absNegative((size - (size % 2)) / 2);
        }
        for (let i = 0; i < size; i++) {
            axis.push(distanceFromOrigin + i);
        }
    }
    return axis;
}
/**
 * Measures the distance between two Coordinates.
 * @returns Returns a coordinate pair representing the position delta.
 * @example
 * readPositionDelta([0,4],[3,-2])
 * // Returns [3,-6]
 */
export function readPositionDelta([initialX, initialY], [finalX, finalY]) {
    let deltaX = finalX - initialX;
    let deltaY = finalY - initialY;
    return [deltaX, deltaY];
}
