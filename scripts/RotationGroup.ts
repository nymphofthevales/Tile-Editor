
type OrderedPair = [any, any]
type Relation = Array<OrderedPair>
import { RotationDirection2D } from "./direction.js"
import { arrayToCircularRelation, relationToMap, invertMap } from "./map_helpers.js"

export class RotationGroup {
    clockwise: Map<any, any>
    counterclockwise: Map<any,any>
    constructor(members: Array<any>) {
        let relation = arrayToCircularRelation(members)
        this.clockwise = relationToMap(relation)
        this.counterclockwise = invertMap(this.clockwise);
    }
    rotate(member, direction: RotationDirection2D = "clockwise"): any {
        if (this.clockwise.has(member)) {
            switch (direction) {
                case "clockwise": return (this.clockwise.get(member))
                case "counterclockwise": return (this.counterclockwise.get(member))
            }
        }
    }
}