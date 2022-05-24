import { arrayToCircularRelation, relationToMap, invertMap } from "./map_helpers.js";
export class RotationGroup {
    constructor(members) {
        let relation = arrayToCircularRelation(members);
        this.clockwise = relationToMap(relation);
        this.counterclockwise = invertMap(this.clockwise);
    }
    rotate(member, direction = "clockwise") {
        if (this.clockwise.has(member)) {
            switch (direction) {
                case "clockwise": return (this.clockwise.get(member));
                case "counterclockwise": return (this.counterclockwise.get(member));
            }
        }
    }
}
