import { GameObject } from "./gameobject.js";
import { Vector } from "../util/vector.js";
export class AbstractLight extends GameObject {
    /**
     * @param {GameObjectArgs & LightArgs} args
     * @param {function(CanvasRenderingContext2D):void} draw the abstract draw method used to draw this type of light
     */
    constructor(args) {
        var _a, _b, _c;
        super(args);
        this.mode = (_a = args.mode) !== null && _a !== void 0 ? _a : "overlay";
        this.strength = (_b = args.strength) !== null && _b !== void 0 ? _b : 10;
        this.color = (_c = args.color) !== null && _c !== void 0 ? _c : "#ffffff";
    }
}
export class OvalLight extends AbstractLight {
    constructor(args) {
        var _a;
        super(args);
        this.radius = (_a = args.radius) !== null && _a !== void 0 ? _a : new Vector(100, 100);
    }
    render(ctx) {
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
    constructor(args) {
        var _a;
        super(args);
        this.radius = (_a = args.radius) !== null && _a !== void 0 ? _a : 100;
    }
    render(ctx) {
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
