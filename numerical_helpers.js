/**
 * Determines whether a number is even.
 * @param n a whole number.
 */
export function isEven(n) {
    return n % 2 == 0;
}
/**
 * Makes a number negative.
 */
export function absNegative(n) {
    return n >= 0 ? -n : n;
}
export function getUniqueIdentifier() {
    let date = new Date();
    let time = date.getUTCMilliseconds();
    let seed = Math.floor(Math.random() * 10000);
    let identifier = time + seed;
    return identifier;
}
