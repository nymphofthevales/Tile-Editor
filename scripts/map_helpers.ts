
type OrderedPair = [any, any]
type Relation = Array<OrderedPair>

/**
 * Generate an array containing all the key names of a given map.
 * @example
 * parseMapKeysToArray({-1 => 'foo', 0 => 'bar', 1 => 'baz'})
 * // returns [-1,0,1]
 */
export function parseMapKeysToArray(map: Map<number,any>): Array<number> {
    let array = []
    map.forEach((value,key,map)=>{
        array.push(key)
    })
    return array
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
export function concatenateMaps(source: Map<any,any>, target: Map<any,any>): Map<any,any> {
    source.forEach((value,key)=>{
        target.set(key,value)
    })
    return target
}
/**
 * For an array sorted from negative to positive (or positive to negative if reversed = true), inserts a number
 * in the position where the number on its left is smaller than it, and the number on its right is larger than it.
 * @param map
 */
export function insertElementInMap(map: Map<number,any>,indexToInsert: number, elementToInsert: any, reverse: boolean = false): Map<number,any> {
    let sortedMap = new Map();
    let comparatorFunction = getSortComparator(reverse)
    let array = parseMapKeysToArray(map)
    array.push(indexToInsert)
    array.sort(comparatorFunction)
    for (let i= 0; i < array.length; i++) {
        let key = array[i]
        if (key == indexToInsert) {
            sortedMap.set(key, elementToInsert)
        } else {
            sortedMap.set(key, map.get(key))
        }
    }
    return sortedMap
}
/**
 * Produces a comparator function between two numbers for use in Array.sort().
 * @see {@link Array.sort}
*/
function getSortComparator(reverse: boolean): (a: any, b: any) => number {
    switch (reverse) {
        case false: return (a,b) => {return a - b}
        case true: return (a,b) => {return b - a}
    }
}

/**
 * Converts an array of elements to a map with those elements as its values, keyed by their indices.
 * @example arrayToMap( ['foo', 'bar', 'baz'] )
 * // returns {0 => 'foo', 1 => 'bar', 2 => 'baz'}
*/
export function arrayToMap(array: Array<any>): Map<number, any> {
    let map = new Map()
    for (let i=0; i < array.length; i++) {
        map.set(i, array[i])
    }
    return map
}
/**
 * Produces the inverse of a mapping, wherein the values of the map passed become keys, and the keys become values.
 * @example invertMap({1 => "foo", 2 => "bar"})
 * // returns {"foo" => 1, "bar" => 2}
*/
export function invertMap(map: Map<any, any>): Map<any, any> {
    let invertedMap = new Map()
    let entries = map.entries()
    for (let entry of entries) {
        let [key, val] = entry
        invertedMap.set(val, key)
    }
    return invertedMap
}

/**
 * Converts an array of elements into a circular relation set with each element related to the next.
 * @example arrayToCircularRelation( [a,b,c] )
 * // returns [ [a,b], [b,c], [c,a] ]
*/
export function arrayToCircularRelation(array: Array<any>): Relation {
    let relation = []
    for (let i=0; i < (array.length-1); i++) {
        relation.push( [array[i], array[i+1]] )
    }
    relation.push( [array[array.length-1], array[0]] )
    return relation
}
/**
 * Converts a relation set to a map.
 * @example relationToMap( [ [a,b], [b,c] ,[c,a] ] )
 * // returns { a => b, b => c, c => a}
*/
export function relationToMap(relation: Relation): Map<any, any> {
    let map = new Map()
    for (let i=0; i < relation.length; i++) {
        let pair = relation[i]
        let [key, val] = pair
        map.set(key, val)
    }
    return map
}