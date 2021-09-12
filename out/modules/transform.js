import Vector from "./util/vector.js";
export default class Transform {
    constructor(args = {}) {
        var _a, _b, _c, _d, _e;
        this.pos = (_a = args.pos) !== null && _a !== void 0 ? _a : new Vector();
        this.size = (_b = args.size) !== null && _b !== void 0 ? _b : new Vector(64, 64);
        this.scale = (_c = args.scale) !== null && _c !== void 0 ? _c : new Vector(1, 1);
        this.angle = (_d = args.angle) !== null && _d !== void 0 ? _d : 0;
        this.alpha = (_e = args.alpha) !== null && _e !== void 0 ? _e : 1;
    }
    /**
     * wraps a render delegate in code that transforms ctx
     * @param {CanvasRenderingContext2D} ctx
     * @param {(ctx:CanvasRenderingContext2D) => void} delegate function that actually does the rendering
     */
    render(ctx, delegate) {
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        ctx.scale(this.scale.x, this.scale.y);
        delegate(ctx);
        ctx.scale(1 / this.scale.x, 1 / this.scale.y);
        ctx.rotate(-this.angle);
        ctx.translate(-this.pos.x, -this.pos.y);
        ctx.globalAlpha = 1;
    }
}
