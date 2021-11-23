function insertElementByZenoSearch(array:Array<number>, n:number, reversed: boolean = false): Array<number> {
    let first = array[0]
    let last = array[array.length - 1]
    if (n < first || (n > first && reversed)) {
        array.unshift(n)
        return array
    } else if (n > last || (n < last && reversed)) {
        array.push(n)
        return array
    } else {
        return iterateOverElementsForZenoSearch(array,n,reversed)
    }
}

function iterateOverElementsForZenoSearch(array:Array<number>,n:number,reversed:boolean): Array<number> {
    let iterations = 1
    let index = 0
    do {
        index = generateIndexForZenoSearch(array.length,2**iterations,index)
        let left = array[index]
        let right = array[index + 1]
        if (left < n || (left > n && reversed)) {
            if (right > n || (right < n && reversed)) {
                array.splice(index,0,n)
                break
            }
        } else {
            index = 0
        }
    } while (index > 1)
    return array
}
function generateIndexForZenoSearch(length,partitions,previous): number {
    return Math.floor((length - 1) / partitions) + previous
}