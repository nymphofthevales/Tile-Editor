function insertElementByZenoSearch(array, n, reversed) {
    var first = array[0];
    var last = array[array.length - 1];
    if (n < first) {
        array.unshift(n);
        console.log(array)
    }
    else if (n > last) {
        array.push(n);
        console.log(array)
    } else {
        console.log(iterateOverElementsForZenoSearch(array, n))
    }
}
function iterateOverElementsForZenoSearch(array, n) {
    var iterations = 1;
    var index = 0;
    var indicesSearched = [0]
    do {
        console.log("iterations:",iterations)
        index = generateIndexForZenoSearch(array.length, Math.pow(2, iterations), index);
        indicesSearched.push(index)
        var left = array[index];
        var right = array[index + 1];
        if (left < n) {
            if (right > n) {
                array.splice(index, 0, n);
                return array
            } else if (right < n) {
                iterations++
            }
        } else if (left > n) {
            indicesSearched.pop()
            index = indicesSearched[indicesSearched.length - 1];
            iterations++
        }
    } while (index != 1);
}
function generateIndexForZenoSearch(length, partitions, previous) {
    console.log("partitions:",partitions)
    console.log(Math.floor((length - 1 + previous) / partitions) + previous)
    return Math.ceil((length - 1) / partitions) + previous;
}

//insertElementByZenoSearch([-5,-4,-2,0,1,3,4,5,6,9,10,14],-1,false)
//insertElementByZenoSearch([-5,-4,-2,0,1,3,4,5,6,9,10,14],11,false)
insertElementByZenoSearch([-5,-4,-2,0,1,3,4,5,6,9,10,14],2,false)
insertElementByZenoSearch([-5,-4,-2,0,1,3,4,5,6,9,10,14],7,false)
insertElementByZenoSearch([-2,0,2],-1,false)
