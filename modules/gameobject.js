import Transform from "./transform.js";


/** 
 * @typedef {Object} GameObjectArgs
 * @property {GameObject[]} [children] list of objects nested under this object. they will get updated/rendered with is object
 * @property {GameObject} [parent] optional parent to auto-append this item to 
 * @property {Transform} [transform] optional transform to apply when rendering
 * @property {function(GameObject):Promise<any>|void} [dispose] funciton to call when this object is done updating and should be removed from parent
 */
export class GameObject {

    /** @param {GameObjectArgs} args */
    constructor(args) {
        this.transform = args.transform ?? new Transform({});

        /** @type {GameObject[]} */
        this.children = args.children ?? [];
        
        // dispose will get passed gameobject reference
        // this is for resolving promises when there's no reference to self yet
        // this could be achieved by "binding" the function, but JSDoc isn't smart enough to detect the function is bound 
        if (args.dispose) {
            this.dispose = () => args.dispose(this);
        } else {
            this.dispose = () => {};
        }

        /** @type {GameObject} */
        this.parent = args.parent;
        if (this.parent) {
            this.parent.children.push(this);
        }
    }


    /** @param {number} deltaTime seconds since last update call */
    update(deltaTime) { 

        if (this.children?.length) {
            for(let i = this.children.length - 1; i>-1; i--) {
                let child = this.children[i];
                // object done updating ? remove it 
                if (child.update(deltaTime)) {
                    child.dispose();
                    //console.log("disposing " + this.name);
                    this.children.splice(i, 1);
                }
            }
        }

        return false;
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render(ctx) {
        if (this.children) {
            this.children.forEach(child => child.render(ctx));
        }
        
    }

}