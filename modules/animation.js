import { GameObject } from "./gameobject.js";
import { clamp, mod } from "./math.js";
import Vector from "./vector.js";
/** 
 * @typedef {import('./transform').default} Transform 
 * @typedef {import("./gameobject.js").GameObjectArgs} GameObjectArgs
 * */

/**
 * @typedef {Object} SharedAnimArgs
 * @property {HTMLImageElement} [sheet] NOTE this is a required field on either Sheet or Animation but not both. It's only defined as optional to avoid warnings
 * @property {Vector} [frameSize]
 * @property {number} [fps] 
 */

// these properties are shared by sheet and animation 
// they can get defaulted at sheet level and then optionally overriden by each individual animation
const shared_options = ["sheet", "frameSize", "fps"];

/** Group of animations for entire sprite sheet */
export class AnimationSheet {

    /**
     * @typedef {Object} AnimationSheetArgs
     * @property {HTMLImageElement} sheet sprite sheet containing all images
     * @property {Object<string,SpriteAnimArgs&SharedAnimArgs>} groups list of configurations for each sprite animation
     */

    /** @param {AnimationSheetArgs&SharedAnimArgs} args */
    constructor(args) {
        this.sheet = args.sheet;
          
        /** @type {Object<string,SpriteAnimation>} */ 
        this.animations = {};
        Object.keys(args.groups).forEach(key => {
            
            let g = args.groups[key];
            
            // passing overridable settings down to animation configurations when not already specified
            shared_options.forEach(key => {
                // @ts-ignore
                if (!g[key]) {
                    // @ts-ignore
                    g[key] = args[key]; 
                }
            });

            this.animations[key] = new SpriteAnimation(g);
        });

    }
}

/** Single animation within a sprite sheet */
export class SpriteAnimation {
  
    /** 
     * @typedef {Object} SpriteAnimArgs 
     * @property {Vector} [frameSize] size of each frame. currently donesn't support different sizes for each frame
     * size of this group (can span across multiple rows/columns)
     * @property {number} [rows] default = 1
     * @property {number} [columns] default = 99
     * calculating start position 
     * @property {Vector} [offset] pixels offset of this animation within sheet (default = 0) gets added to row/column if specified
     * @property {number} [row] NOTE: this starts at 1, not 0
     * @property {number} [column] NOTE: this starts at 1, not 0
     * @property {Vector} [scale] scale multiplier that gets multiplied to size (negative values will flip)
     */
     
    /** @param {SpriteAnimArgs & SharedAnimArgs} args */
    constructor(args) {
        if (!args.sheet) throw "Sprite Animation Required a sheet.";
        
        this.sheet = args.sheet;
        this.frameSize = args.frameSize ?? new Vector(64, 64);
        this.rows = args.rows ?? 1;
        this.columns = args.columns ?? 99;
        this.scale = args.scale ?? new Vector(1, 1);
        this.fps = args.fps ?? 30;

        // calculating offset given combination of pixel offset and row/column sizing
        const offset = args.offset ?? new Vector();
        const row = args.row ?? 1;
        const column = args.column ?? 1;
        this.offset = new Vector(
            offset.x + ((column-1) * this.frameSize.x), 
            offset.y + ((row-1) * this.frameSize.y)
        );
    }

    /*
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} column
     * @param {number} row
     * @param {Transform} transform 
     *
    render(ctx, column, row, transform) {
        // clamping within image bounds
        let sx = clamp(this.offset.x + (column * this.frameSize.x), 0, this.sheet.width - this.frameSize.x);
        let sy = clamp(this.offset.y + (row * this.frameSize.y), 0, this.sheet.height - this.frameSize.y);

        ctx.globalAlpha = transform.alpha;
        ctx.translate(transform.pos.x, transform.pos.y);
        ctx.rotate(transform.angle);
        ctx.drawImage(this.sheet, sx, sy, this.frameSize.x, this.frameSize.y, -transform.size.x/2, -transform.size.y/2, transform.size.x, transform.size.y);
        ctx.rotate(-transform.angle);
        ctx.translate(-transform.pos.x, -transform.pos.y);
        ctx.globalAlpha = 1
    }*/

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} column 
     * @param {number} row 
     * @param {Vector} size 
     */
    render(ctx, column, row, size) {
        let sx = clamp(this.offset.x + (column * this.frameSize.x), 0, this.sheet.width - this.frameSize.x);
        let sy = clamp(this.offset.y + (row * this.frameSize.y), 0, this.sheet.height - this.frameSize.y);

        ctx.scale(this.scale.x, this.scale.y);
        ctx.drawImage(this.sheet, sx, sy, this.frameSize.x, this.frameSize.y, -size.x/2, -size.y/2, size.x, size.y);
        ctx.scale(1 / this.scale.x, 1 / this.scale.y);

    }

    // TODO: create function that returns animation task
    // "anim.run()" returns task

    /** @param {AnimationTaskArgs} [args] */
    run(args = {}) {
        args.anim = this;
        if (!args.fps) {
            args.fps = this.fps;
        }

        return new AnimationTask(args);
    }
}

/** Task for playing a single animation. Can loop indefinitely or get disposed once a certain number of loops have played */
export class AnimationTask {
 
    /** 
     * @typedef {Object} AnimationTaskArgs 
     * @property {SpriteAnimation} [anim]
     * @property {number} [numLoops] number of times to loop before resolving task
     * @property {number} [fps] default = 30
     * @property {function(AnimationTask):void} [dispose] 
     * @param {AnimationTaskArgs} args */
    constructor(args) {
        this.anim = args.anim;

        this.fps = args.fps ?? 30;
        /** seconds per frame */
        this.sfp =  1 / this.fps;


        this.dispose = args.dispose;
        this.numLoops = args.numLoops;
        this.column = 0;
        this.row = 0;

        /** @type {function[]} */
        this.resolvers = [];
    }

    wait() {
        // create a new promise and it's resolve method to the resolver array
        //  when this animation is finished, it will resolve all promises that are currently waiting
        return new Promise(resolve => this.resolvers.push(resolve));
    }

    /** milliseconds spent on current frame. will advance to next frame when this exceeds mspf */
    timer = 0;

    /** current loop # */
    loop = 0;

    /** @param {number} deltaTime number of seconds since last frame */
    update(deltaTime) {

        this.timer += deltaTime;

        // frameTime met -> advance to next frame
        if (this.timer >= this.sfp) {
            this.timer = 0;

            this.column++;

            // reached end of column -> wrap to next row (or simply reset column if only 1 row)
            if (this.column > this.anim.columns - 1) {
                this.column = 0;
                this.row++;

                // reached end of columns and end or rows ? increment loop count 
                if (this.row > this.anim.rows - 1) {
                    this.loop++;
                    this.row = 0;
                }
            }
        }

        // numLoops is an optional field so it might be undefined
        // "number > undefined" will always be false so this would never resolve when numLoops is not specified
        let finished = this.loop >= this.numLoops;
        if (finished) {
            this.resolvers.forEach(resolve => resolve());
        }

        return finished;
    }


    /** 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Vector} size
    */
    render(ctx, size) {
        this.anim.render(ctx, this.column, this.row, size);
    }

}

/** stationary object that gets updated/rendered until animation is complete */
export class AnimationObject extends GameObject {

    /** 
     * 
     * @typedef {Object} AnimationObjectArgs
     * @property {AnimationTask} anim
     * @property {Transform} transform
     */

    /** @param {GameObjectArgs & AnimationObjectArgs} args */
    constructor(args) {
        super(args);
        this.anim = args.anim;
        this.transform = args.transform;
        console.log("hiii");
    }

    /** @param {number} deltaTime */
    update(deltaTime) {
        console.log("updating animation object!");
        super.update(deltaTime);
        return this.anim.update(deltaTime);
    }

    /** @param {CanvasRenderingContext2D} ctx */
    render(ctx) {
        super.render(ctx);
        this.transform.render(ctx, () => {
            this.anim.render(ctx, this.transform.size);
        });
    }
}

/** 
 * @param {AnimationObjectArgs & GameObjectArgs} args
 * @returns {Promise<GameObject>}
 */
 AnimationObject.Promise = function(args) {
    return new Promise(resolve => {
        args.dispose = self => resolve(self);
        new AnimationObject(args);
    })
}


/** @enum {number} */
const directions = {
    UP: 0,
    LEFT: 1,
    DOWN: 2,
    RIGHT: 3
}

/** converts angle to direction 
 * @param {number} angle */
function getDirection(angle) {
    const a = mod(angle, Math.PI * 2);
    const quad = Math.PI / 4;
    if (a > quad * 7)  return directions.UP; 
    if (a > quad * 5)  return directions.LEFT;  
    if (a > quad * 3)  return directions.DOWN; 
    if (a > quad) return directions.RIGHT;
    return directions.UP;
}



