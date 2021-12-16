/**
 * Generate an array containing all the key names of a given map.
 * @example
 * parseMapKeysToArray({-1 => 'foo', 0 => 'bar', 1 => 'baz'})
 * // returns [-1,0,1]
 */
export function parseMapKeysToArray(map) {
    let iterable = map.keys();
    let next;
    let array = [];
    do {
        next = iterable.next();
        if (next.value != undefined) {
            array.push(next.value);
        }
    } while (next.done === false);
    return array;
}
/**
 * Appends all elements of the source map, in order, onto the end of the target map.
 * Mutates the second map passed.
 * Note: Expects that maps do not have overlapping key names.
 * @param source the map to take elements from.
 * @param target the map onto which elements are added.
 * @returns the modified target map.
 * @example
 * concatenateMaps({1 => 'foo', 2 => 'foo', 3 => 'foo'}, {0 => 'baz'})
 * // returns {0 => 'baz', 1 => 'foo', 2 => 'foo', 3 => 'foo'}
 */
export function concatenateMaps(source, target) {
    source.forEach((value, key) => {
        target.set(key, value);
    });
    return target;
}
/**
 * For an array sorted from negative to positive (or positive to negative if reversed = true), inserts a number
 * in the position where the number on its left is smaller than it, and the number on its right is larger than it.
 * @param map
 */
export function insertElementInMap(map, indexToInsert, elementToInsert, reverse = false) {
    let array = [];
    let sortedMap = new Map();
    let comparatorFunction = getSortComparator(reverse);
    array = fillArrayWithMapKeys(array, map);
    array.push(indexToInsert);
    array.sort(comparatorFunction);
    for (let i = 0; i < array.length; i++) {
        let key = array[i];
        if (key == indexToInsert) {
            sortedMap.set(key, elementToInsert);
        }
        else {
            sortedMap.set(key, map.get(key));
        }
    }
    return sortedMap;
}
function getSortComparator(reverse) {
    switch (reverse) {
        case false: return (a, b) => { return a - b; };
        case true: return (a, b) => { return b - a; };
    }
}
function fillArrayWithMapKeys(array, map) {
    map.forEach((value, key, map) => {
        array.push(key);
    });
    return array;
}
