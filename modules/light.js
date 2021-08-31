import { GameObject } from "./gameobject.js";
import { _default } from "./util.js";

/**
 * @typedef {import("./gameobject.js").GameObjectArgs} GameObjectArgs 
 * 
 * @typedef {Object} LightArgs
 * @property {number} [strength] strtength of the light. default = 10
 * @property {number} [r]
 * @property {number} [g]
 * @property {number} [b]
 */



export class AbstractLight extends GameObject {
    /** 
     * @param {GameObjectArgs & LightArgs} args
     * @param {function(CanvasRenderingContext2D):void} draw the abstract draw method used to draw this type of light
     */
    constructor(args, draw) {
        super(args);
        this.strength = args.strength ?? 10;
        this.render = draw ?? (_ => {});
        this.setColor(args.r, args.g, args.b)
    }


    /**
     * 
     * @param {number} r 
     * @param {number} g 
     * @param {number} b 
     */
    setColor(r = 255, g = 255, b = 255) {
        this.color = `rgba(${r}, ${g}, ${b}, `;
    }

}



/** 
 * @typedef {Object} CircleLightArgs
 * @property {number} [radius] radius of the circle. default = 5
 */
export class CircleLight extends AbstractLight {

    /** @param {CircleLightArgs & LightArgs & GameObjectArgs} args */
    constructor(args) {
        super(args, ctx => {

            this.transform.render(ctx, () => {
                const gradient = ctx.createRadialGradient(0, 0, this.radius/2, 0, 0, this.radius);
                gradient.addColorStop(0, this.color + "1)");
                gradient.addColorStop(0.5, this.color + "0.5)");
                gradient.addColorStop(0.75, this.color + "0.25)");
                gradient.addColorStop(1, this.color + "0)");
                ctx.fillStyle = gradient;
        
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            })
    
        });

        this.radius = args.radius ?? 5;
    }

}