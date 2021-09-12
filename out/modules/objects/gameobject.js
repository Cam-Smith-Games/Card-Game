import Transform from "../transform.js";
export class GameObject {
    constructor(args) {
        var _a, _b;
        this.transform = (_a = args.transform) !== null && _a !== void 0 ? _a : new Transform({});
        this.children = (_b = args.children) !== null && _b !== void 0 ? _b : [];
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
    render(ctx) {
        if (this.children) {
            this.transform.render(ctx, ctx => {
                this.children.forEach(child => child.render(ctx));
            });
        }
    }
}
