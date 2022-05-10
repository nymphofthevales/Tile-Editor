

export type Direction = 'top' | 'bottom' | 'left' | 'right'
export type AdjacentDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type QuantizedAngle = 0 | 90 | 270 | 360
export type RotationDirection2D = 'clockwise' | 'counterclockwise'
/**
 * Lists all Direction and AdjacentDirection strings in clockwise order.
 */
export const Directions: Array<Direction | AdjacentDirection>  = ['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left']
/**
 * Lists the cardinal Direction strings in clockwise order.
 */
export const PerpendicularDirections: Array<Direction> = ['top', 'right', 'bottom', 'left']

