import { Transform, TransformArgs } from "../transform.js";
import { Vector } from "../util/vector.js";


export interface GameObjectArgs extends TransformArgs {
    /** list of objects nested under this object. they will get updated/rendered with is object */
    children? : GameObject[];
    /** optional parent to auto-append this item to  */
    parent?: GameObject;
    /** funciton to call when this object is done updating and should be removed from parent */
    dispose?: (obj:GameObject) => Promise<any>|void;   


    /**
     * position offset in local coordinates to apply for rendering (some sprites don't align with their actual position)
     * this is separate from transform because it is related to the sprite as oppposed to actual in-game position
     */
    offset?: Vector;
}

export class GameObject extends Transform {

    parent: GameObject;
    children: GameObject[];
    dispose: (obj?:GameObject) => Promise<any>|void;   
    offset: Vector;

    constructor(args : GameObjectArgs) {
        super(args);

        this.children = args.children ?? [];     
        this.offset = args.offset ?? new Vector();


        // dispose will get passed gameobject reference
        // this is for resolving promises when there's no reference to self yet
        // this could be achieved by "binding" the function, but JSDoc isn't smart enough to detect the function is bound 
        if (args.dispose) {
            this.dispose = () => args.dispose(this);
        } else {
            this.dispose = () => {};
        }

        this.parent = args.parent;
        if (this.parent) {
            this.parent.children.push(this);
        }
    }


    update(deltaTime : number) { 

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

    /** 
     * @virtual 
     * default render method that gets wrapped in _render for transforming canvas and rendering all children
     * this can get overriden by certain GameObject implementations for custom rendering logic
    */
    render(ctx : CanvasRenderingContext2D) {
        // if no custom render method is provided to render this object, it will simply render all of it's childrne
        this._render(ctx, null);
    }

    /** 
     * @protected
     * protected render method that transforms the canvas to this object and renders all children.
     * this is only called by private render method
     */
    _render(ctx : CanvasRenderingContext2D, renderSelf: () => void) {
        super.transformRender(ctx, () => {
      
            if (this.children?.length) {
                this.children.forEach(child => child.render(ctx));
            }
            if (renderSelf) {
                // NOTE: canvas has already been scaled/translated by transform
                //          this offset translation is in LOCAL coordinates (will be effected by scale, rotation, etc)
                ctx.translate(this.offset.x, this.offset.y);
                renderSelf();
                ctx.translate(-this.offset.x, -this.offset.y);

            }

        })
    }

}