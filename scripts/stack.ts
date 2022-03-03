export class Stack {
    _stack = []
    constuctor() {
    }
    pop() {
        this._stack.pop()
    }
    push(element: any) {
        this._stack.push(element)
    }
    clear() {
        this._stack = []
    }
    get length() {
        return 
    }
    get latest() {
        let index = this._stack.length - 1
        return this._stack[index]
    }
    get oldest() {
        return this._stack[0]
    }
}