import { GameObject } from "./gameobject.js";
export { Announcement as default };

/**
 * @typedef {import("./gameobject.js").GameObjectArgs} GameObjectArgs
 *
 * @typedef {Object} AnnouncementArgs
 * @property {string} text
 * @property {string} [font] 
 * @property {number} [r] 
 * @property {number} [g] 
 * @property {number} [b] 
 * @property {number} [x] 
 * @property {number} [y] 
 * @property {number} [maxWidth] 
 * @property {boolean} [outline]
 */


class Announcement extends GameObject {
    
    /** @param {AnnouncementArgs & GameObjectArgs} args  */
    constructor(args) {
        super(args);
        
        this.text = args.text;
        this.font = args.font ?? "48px Arial";    
        this.alpha = 1;
        this.r = args.r ?? 255;
        this.g = args.g ?? 0;
        this.b = args.b ?? 0;
        this.x = args.x ?? 0;
        this.y = args.y ?? 0;
        this.maxWidth = args.maxWidth;
        this.outline = args.outline ?? true;
    }

    /** @param {number} deltaTime */
    update(deltaTime) {
        super.update(deltaTime);
        this.alpha -= deltaTime;
        return this.alpha < 0;  
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render(ctx) {
        super.render(ctx);

        ctx.save();

        ctx.font = this.font;
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.x, this.y, this.maxWidth);

        if (this.outline) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 0.25;
            ctx.strokeText(this.text, this.x, this.y, this.maxWidth);
        }

        ctx.restore();
    }
}

/** @param {AnnouncementArgs & GameObjectArgs} args  */
Announcement.Promise = function(args) {
    return new Promise(resolve => {
        args.dispose = self => resolve(self);
        new Announcement(args);
    })
}
