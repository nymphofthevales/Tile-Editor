

export function forEachInClass(targetClass: string, callback: Function): void {
    let elements = document.getElementsByClassName(targetClass)
    for (let i=0; i < elements.length; i++) {
        callback(elements[i])
    }
}

export function removeClassFromAllMembers(targetClass, className): void {
    forEachInClass(targetClass, (elem)=>{
        elem.classList.remove(className)
    })
}

export function addClassToAllMembers(targetClass, className): void {
    forEachInClass(targetClass, (elem)=>{
        elem.classList.add(className)
    })
}