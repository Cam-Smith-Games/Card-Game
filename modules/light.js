import { _default } from "./util.js";

/**
 * @typedef {Object} LightOptions
 * @property {number} [strength] strtength of the light. default = 10
 * @property {number} [x] x position
 * @property {number} [y] y position 
 */

/** 
 * @typedef {Object} CircleLightOptions
 * @property {number} [radius] radius of the circle. default = 5
 */


export class AbstractLight {
    /** 
     * @param {LightOptions} args
     * @param {function(CanvasRenderingContext2D):void} draw the abstract draw method used to draw this type of light
     */
    constructor(args, draw) {
        if (new.target == AbstractLight) {
            throw "Abstract class cannot be instantiated";
        }
        this.strength = _default(args.strength, 10);
        this.x = _default(args.x, 0);
        this.y = _default(args.y, 0);
        this.render = _default(draw, () => {});
    }

}

/*
 * @param {CanvasRenderingContext2D} ctx
 * @param  {...AbstractLight} lights 
 *
AbstractLight.renderAll = function(ctx, ...lights) {
    const comp_before = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "destination-in";
   
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    lights.forEach(light => light._draw(ctx));

    ctx.globalCompositeOperation = comp_before;
}*/

export class CircleLight extends AbstractLight {

    /** @param {CircleLightOptions & LightOptions} args */
    constructor(args) {
        super(args, ctx => {
            const gradient = ctx.createRadialGradient(this.x, this.y, this.radius/2, this.x, this.y, this.radius);
            gradient.addColorStop(0, this.color + "1)");
            gradient.addColorStop(0.5, this.color + "0.5)");
            gradient.addColorStop(0.75, this.color + "0.25)");
            gradient.addColorStop(1, this.color + "0)");
            ctx.fillStyle = gradient;
    
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        });


        this.radius = _default(args.radius, 5);

        // this should be dynamic, but need separate the alpha channel... might be easier with hex? or separate r,g,b which would be lame
        this.color = "rgba(255, 255, 255, ";

    }

}