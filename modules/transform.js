import Vector from "./vector.js";


/**
 * @typedef {Object} TransformArgs
 * @property {Vector} [pos]
 * @property {Vector} [size] base size without scaling. default = 64x64
 * @property {Vector} [scale] scale multiplier that gets multiplied to size (negative values will flip)
 * @property {number} [angle]
 * @property {number} [alpha]
 */

export default class Transform {
    /** @param {TransformArgs} args */
    constructor(args) {
        this.pos = args.pos ?? new Vector();
        this.size = args.size ?? new Vector(64, 64);
        this.scale = args.scale ?? new Vector(1, 1);
        this.angle = args.angle ?? 0;
        this.alpha = args.alpha ?? 1;
    }


    /**
     * wraps a render delegate in code that transforms ctx
     * @param {CanvasRenderingContext2D} ctx 
     * @param {function(CanvasRenderingContext2D):void} delegate function that actually does the rendering 
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
        ctx.globalAlpha = 1
    }
}


// TODO: use RenderTransform to re-use some code for drawing things with transform

/*
 * @typedef {Object} RenderTransformArgs
 *

export class RenderTransform extends Transform {
    /** @param {TransformArgs & RenderTransformArgs} args *
    constructor(args) {
        super(args);
    }


    fillText(ctx, args) {
        ctx.moveTo(this.pos.x, this.pos.y);

    }

    image(ctx, img) {
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.drawImage(img)
    }

    /**
     * strokes or fills rectangle at current position with specified style
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} style stroke or fillstyle to apply 
     * @param {('fill'|'stroke')} mode whether to stroke or fill rect
     *
    rect(ctx, style, mode = "fill") {
        ctx.moveTo(this.pos.x, this.pos.y);
        if (style) {
            // @ts-ignore
            ctx[mode + "Style"] = style;
        }
        // @ts-ignore
        ctx[mode + "Rect"](-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    }

}*/