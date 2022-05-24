export function forEachInClass(targetClass, callback) {
    let elements = document.getElementsByClassName(targetClass);
    for (let i = 0; i < elements.length; i++) {
        callback(elements[i]);
    }
}
export function removeClassFromAllMembers(targetClass, className) {
    forEachInClass(targetClass, (elem) => {
        elem.classList.remove(className);
    });
}
export function addClassToAllMembers(targetClass, className) {
    forEachInClass(targetClass, (elem) => {
        elem.classList.add(className);
    });
}
