
class MapNode {

    /** @type {MapNode[]} */
    children = [];

    constructor() {

    }


    /**
     * 
     * @param {number} maxDepth depth to stop at
     * @param {number} depth current depth in tree 
     */
    generate(maxDepth, depth = 0, ) {

        this.children = [];

        // 1 or 2 children
        let numChildren = Math.ceil(Math.random() * 2);
        for (let i = 0 ; i < numChildren; i++) {
            // node will have a random amount of children
            let node = getRandomNode();
            node.generate(depth + 1, maxDepth)
            this.children.push(node);
        }

        return this;
    }

    
}


// todo: return random node from list given their weight/percentage
function getRandomNode() {
    return new MapNode();
}

class NodeMap {

    constructor() {
        // TODO: make maxDepth a property of map
        this.root = getRandomNode().generate(10);
    }

}


var map = new NodeMap();