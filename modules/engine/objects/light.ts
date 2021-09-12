import { GameObject, GameObjectArgs } from "./gameobject.js";
import { Vector } from "../util/vector.js";

/**
 * @typedef {import("./gameobject.js").GameObjectArgs} GameObjectArgs 
 * 
 * @typedef {Object} LightArgs
 * @property {number} [strength] strtength of the light. default = 10
 * @property {number} [r]
 * @property {number} [g]
 * @property {number} [b]
 */


interface LightArgs extends GameObjectArgs {
    mode?: string;
    strength?: number;
    color?: string;
}


export class AbstractLight extends GameObject {

    strength: number;
    color: string;
    mode: string;

    /** 
     * @param {GameObjectArgs & LightArgs} args
     * @param {function(CanvasRenderingContext2D):void} draw the abstract draw method used to draw this type of light
     */
    constructor(args: LightArgs) {
        super(args);

        this.mode = args.mode ?? "overlay";
        this.strength = args.strength ?? 10;
        this.color = args.color ?? "#ffffff";
    }

}


interface CircleLightArgs extends LightArgs {
    radius?: number;
}
interface OvalLightArgs extends LightArgs {
    radius?: Vector;
}

export class OvalLight extends AbstractLight {
    radius: Vector;

    constructor(args: OvalLightArgs) {
        super(args);
        this.radius = args.radius ?? new Vector(100, 100);
    }

    render(ctx: CanvasRenderingContext2D) {
        super._render(ctx, () => {
            // NOTE: using scale to stretch the circle instead of using an ellipse
            //          ellipse doesn't account for full gradient

            let scale = this.radius.x / this.radius.y;
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius.x / scale);
            gradient.addColorStop(0, this.color + "ff");
            gradient.addColorStop(0.5, this.color + "bf");
            gradient.addColorStop(0.75, this.color + "40");
            gradient.addColorStop(1, this.color + "00");

            ctx.fillStyle = gradient;

            let before = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = this.mode;

    
            ctx.scale(scale, 1);

            
            ctx.beginPath();
            //ctx.ellipse(0, 0, this.radius.x, this.radius.y, 0, 0, Math.PI * 2);
            ctx.arc(0, 0, this.radius.x / scale, 0, Math.PI * 2);

            ctx.fill();
            
            ctx.scale(1 / scale, 1);
            
            ctx.closePath();
            ctx.globalCompositeOperation = before;

        });
    }
}

export class CircleLight extends AbstractLight {

    radius: number;

    constructor(args: CircleLightArgs) {
        super(args);
        this.radius = args.radius ?? 100;
    }

    render(ctx: CanvasRenderingContext2D) {
        super._render(ctx, () => {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            gradient.addColorStop(0, this.color + "ff");
            gradient.addColorStop(0.5, this.color + "bf");
            gradient.addColorStop(0.75, this.color + "40");
            gradient.addColorStop(1, this.color + "00");

            ctx.fillStyle = gradient;
    
            let before = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = this.mode;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
            ctx.globalCompositeOperation = before;
        });
    }

}