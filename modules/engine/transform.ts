import { Vector } from "./util/vector.js";

export interface TransformArgs {
    pos?: Vector;
    offset?: Vector;
    /** base size without scaling. default = 64x64 */
    size?: Vector;
    /** scale multiplier that gets multiplied to size (negative values will flip) */
    scale?: Vector;
    angle?: number;
    alpha?: number;

    velocity?: Vector;
}

export class Transform {
    pos: Vector;
    size: Vector;
    scale: Vector;
    angle: number;
    alpha: number;
    velocity: Vector;

    constructor(args : TransformArgs = {}) {
        this.pos = args.pos ?? new Vector();
        this.size = args.size ?? new Vector(64, 64);
        this.scale = args.scale ?? new Vector(1, 1);
        this.angle = args.angle ?? 0;
        this.alpha = args.alpha ?? 1;
        this.velocity = args.velocity ?? new Vector();
    }


    /**
     * wraps a render delegate in code that transforms ctx
     * @param {CanvasRenderingContext2D} ctx 
     * @param {(ctx:CanvasRenderingContext2D) => void} delegate function that actually does the rendering 
     */
    transformRender(ctx : CanvasRenderingContext2D, delegate : (ctx:CanvasRenderingContext2D) => void) {
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.pos.x, this.pos.y);
        
        ctx.rotate(this.angle);
        ctx.scale(this.scale.x, this.scale.y);

        //ctx.strokeStyle = "rgb(0, 255, 0)";
        //ctx.strokeRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);

        delegate(ctx);

        ctx.scale(1 / this.scale.x, 1 / this.scale.y);
        ctx.rotate(-this.angle);
        ctx.translate(-this.pos.x, -this.pos.y);
        ctx.globalAlpha = 1
    }
}