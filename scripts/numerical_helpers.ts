/**
 * Determines whether a number is even.
 * @param n a whole number.
 */
export function isEven(n: number): boolean {
    return n % 2 == 0;
}
/**
 * Makes a number negative.
 */
export function absNegative(n: number): number {
    return n >= 0 ? -n : n
}
export function getUniqueIdentifier() : number {
    let date = new Date()
    let time = date.getUTCMilliseconds()
    let seed = Math.floor(Math.random()*10000)
    let identifier = time + seed
    return identifier
}