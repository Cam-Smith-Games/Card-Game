import { randoProb } from "../../modules/random.js";
// https://www.reddit.com/r/proceduralgeneration/comments/ber644/procedural_overmap_generation_inspired_by_slay/
const MAP_WIDTH = 500;
class DungeonMap {
    constructor(length = 5) {
        this.rows = [];
        this.container = document.createElement("div");
        this.container.classList.add("map");
        document.body.appendChild(this.container);
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        this.container.append(this.svg);
        this.nav = document.createElement("nav");
        this.container.append(this.nav);
        this.generate(length);
        // enable last row (technically first since row 0 is boss)
        for (let node of this.rows[this.rows.length - 1]) {
            node.button.disabled = false;
        }
        console.log(this.rows);
    }
    /** generates random dungeon nodes  */
    generate(numRows) {
        // first row is always 1 boss node
        this.rows.push([new BossNode(this.getRowElement(), MAP_WIDTH)]);
        for (var i = 1; i < numRows; i++) {
            const numColumns = Math.floor(Math.random() * 4) + 1;
            const row = [];
            this.rows.push(row);
            const rowElement = this.getRowElement();
            //const widths = distribute(500, numColumns);
            for (let j = 0; j < numColumns; j++) {
                //let type = DungeonNodes[Math.floor(Math.random() * (DungeonNodes.length-1))]; // -1 to exclude BOSS
                let type = randoProb([
                    { item: MonsterNode, probability: 85 },
                    { item: TreasureNode, probability: 5 },
                    { item: ShopNode, probability: 10 },
                ]);
                row.push(new type(rowElement, MAP_WIDTH / numColumns));
            }
        }
        this.connectNodes();
        // remove "dead" nodes (i.e. nodes with no children that would be impossible to traverse to)
        for (i = this.rows.length - 2; i > -1; i--) {
            const row = this.rows[i];
            const childRow = this.rows[i + 1];
            for (let j = row.length - 1; j > -1; j--) {
                let node = row[j];
                let hasChildren = childRow.filter(n => n.parents.includes(node)).length > 0;
                if (!hasChildren) {
                    let closest = this.getClosest(node, childRow);
                    const line = getLine(node.button, closest.button);
                    node.lines.push(line);
                    closest.lines.push(line);
                    this.svg.append(line);
                    closest.parents.push(node);
                    //row.splice(j, 1);
                    //node.button.remove();
                    //node.lines.forEach(line => line.remove());
                }
            }
        }
    }
    getRowElement() {
        const row = document.createElement("div");
        row.classList.add("row");
        this.nav.appendChild(row);
        return row;
    }
    connect(child, parent) {
        const line = getLine(parent.button, child.button);
        parent.lines.push(line);
        child.lines.push(line);
        this.svg.append(line);
        child.parents.push(parent);
    }
    /** generates arrows connecting nodes to their parents */
    connectNodes() {
        // drawing arrows between nodes
        for (let i = 0; i < this.rows.length - 1; i++) {
            const row1 = this.rows[i];
            const row2 = this.rows[i + 1];
            // keeps swapping directions until all nodes are connected
            // (i.e. row1->row2, row2->row1... takes 2 passes unless both rows are single nodes)
            let dir = 1;
            let count = 0;
            while (row1.filter(d => !d.lines.length).length || row2.filter(d => !d.lines.length).length) {
                count++;
                let r1, r2;
                if (dir == 1) {
                    r1 = row1;
                    r2 = row2;
                }
                else {
                    r1 = row2;
                    r2 = row1;
                }
                for (let node of r1) {
                    if (!node.lines.length) {
                        let closest = this.getClosest(node, r2);
                        if (dir == 1) {
                            this.connect(closest, node);
                        }
                        else {
                            this.connect(node, closest);
                        }
                    }
                }
                dir *= -1;
            }
        }
    }
    getClosest(from, nodes) {
        let minDist = Infinity;
        let closest = null;
        for (let node of nodes) {
            let dist = getDist(from.button, node.button);
            if (dist < minDist) {
                minDist = dist;
                closest = node;
            }
        }
        return closest;
    }
}
/** @abstract */
class DungeonNode {
    constructor(row, width, type, _click) {
        this.parents = [];
        this.lines = [];
        this.type = type;
        const icon = DungeonTypeIcons[this.type];
        const container = document.createElement("div");
        container.style.width = width + "px";
        row.appendChild(container);
        const wrapper = document.createElement("div");
        wrapper.classList.add("node");
        container.appendChild(wrapper);
        this.button = document.createElement("button");
        this.button.classList.add("fa");
        this.button.classList.add("fa-" + icon);
        this.button.disabled = true;
        this.button.addEventListener("click", () => this.click());
        wrapper.appendChild(this.button);
        this.click = function () {
            this.parents.forEach(parent => parent.button.disabled = false);
            this.button.parentElement.classList.add("complete");
            // disable all buttons in this row
            this.button.parentElement.parentElement.parentElement
                .querySelectorAll("button")
                .forEach(button => button.disabled = true);
            _click();
        };
    }
    /** abstract method defined separately for each type of dungeon node */
    click() { }
}
// this will probably share code between Monster/Elite/Boss nodes (theyre all just battle nodes, just generates different types of battles)
class MonsterNode extends DungeonNode {
    constructor(row, width) {
        super(row, width, DungeonTypes.MONSTER, () => {
            // pick some random monsters / preset battle
            //  then do battle
            console.log("YEEET");
        });
    }
}
class ShopNode extends DungeonNode {
    constructor(row, width) {
        super(row, width, DungeonTypes.SHOP, () => {
            console.log("TODO: Shop");
        });
    }
}
class TreasureNode extends DungeonNode {
    constructor(row, width) {
        super(row, width, DungeonTypes.TREASURE, () => {
            console.log("TODO: Treasure");
        });
    }
}
class BossNode extends DungeonNode {
    constructor(row, width) {
        super(row, width, DungeonTypes.BOSS, () => {
            console.log("TODO: Boss");
        });
    }
}
var DungeonTypes;
(function (DungeonTypes) {
    DungeonTypes[DungeonTypes["MONSTER"] = 0] = "MONSTER";
    DungeonTypes[DungeonTypes["TREASURE"] = 1] = "TREASURE";
    DungeonTypes[DungeonTypes["SHOP"] = 2] = "SHOP";
    DungeonTypes[DungeonTypes["BOSS"] = 3] = "BOSS";
})(DungeonTypes || (DungeonTypes = {}));
// these are FontAwesome icons. Indices align with the associated DungeonType in the DungeonTypes enum
const DungeonTypeIcons = ["skull", "gift", "shopping-cart", "crown"];
const DungeonNodes = [MonsterNode, TreasureNode, ShopNode, BossNode];
function getDist(from, to, from_anchor = "center center", to_anchor = "center center") {
    const pos1 = getPos(from, from_anchor);
    const pos2 = getPos(to, to_anchor);
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2)
        +
            Math.pow(pos2.y - pos1.y, 2));
}
function getLine(from, to, from_anchor = "center center", to_anchor = "center center") {
    const pos1 = getPos(from, from_anchor);
    const pos2 = getPos(to, to_anchor);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', pos1.x.toString());
    line.setAttribute('y1', pos1.y.toString());
    line.setAttribute('x2', pos2.x.toString());
    line.setAttribute('y2', pos2.y.toString());
    return line;
}
function getPos(el, anchor) {
    var _a, _b;
    const anchors = anchor.split(" ");
    return {
        x: getAnchorPos(el.offsetLeft, el.offsetWidth, (_a = anchors[0]) !== null && _a !== void 0 ? _a : "center"),
        y: getAnchorPos(el.offsetTop, el.offsetHeight, (_b = anchors[1]) !== null && _b !== void 0 ? _b : "center")
    };
}
function getAnchorPos(start, length, anchor) {
    return start + (anchor == ("left" || "top") ? 0 :
        anchor == "center" ? (length / 2) :
            length);
}
var map = new DungeonMap(10);
