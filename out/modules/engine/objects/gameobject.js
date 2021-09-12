import { Transform } from "../transform.js";
import { Vector } from "../util/vector.js";
export class GameObject extends Transform {
    constructor(args) {
        var _a, _b;
        super(args);
        this.children = (_a = args.children) !== null && _a !== void 0 ? _a : [];
        this.offset = (_b = args.offset) !== null && _b !== void 0 ? _b : new Vector();
        // dispose will get passed gameobject reference
        // this is for resolving promises when there's no reference to self yet
        // this could be achieved by "binding" the function, but JSDoc isn't smart enough to detect the function is bound 
        if (args.dispose) {
            this.dispose = () => args.dispose(this);
        }
        else {
            this.dispose = () => { };
        }
        this.parent = args.parent;
        if (this.parent) {
            this.parent.children.push(this);
        }
    }
    update(deltaTime) {
        var _a;
        if ((_a = this.children) === null || _a === void 0 ? void 0 : _a.length) {
            for (let i = this.children.length - 1; i > -1; i--) {
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
    render(ctx) {
        // if no custom render method is provided to render this object, it will simply render all of it's childrne
        this._render(ctx, null);
    }
    /**
     * @protected
     * protected render method that transforms the canvas to this object and renders all children.
     * this is only called by private render method
     */
    _render(ctx, renderSelf) {
        super.transformRender(ctx, () => {
            var _a;
            if ((_a = this.children) === null || _a === void 0 ? void 0 : _a.length) {
                this.children.forEach(child => child.render(ctx));
            }
            if (renderSelf) {
                // NOTE: canvas has already been scaled/translated by transform
                //          this offset translation is in LOCAL coordinates (will be effected by scale, rotation, etc)
                ctx.translate(this.offset.x, this.offset.y);
                renderSelf();
                ctx.translate(-this.offset.x, -this.offset.y);
            }
        });
    }
}
