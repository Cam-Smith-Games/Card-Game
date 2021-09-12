import { GameObject } from "./objects/gameobject.js";
import { clamp } from "./util/math.js";
import { Vector } from "./util/vector.js";
// these properties are shared by sheet and animation 
// they can get defaulted at sheet level and then optionally overriden by each individual animation
const shared_options = ["sheet", "frameSize", "fps"];
/** Group of animations for entire sprite sheet */
export class AnimationSheet {
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
    constructor(args) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!args.sheet)
            throw "Sprite Animation Required a sheet.";
        this.sheet = args.sheet;
        this.size = (_a = args.frameSize) !== null && _a !== void 0 ? _a : new Vector(64, 64);
        this.rows = (_b = args.rows) !== null && _b !== void 0 ? _b : 1;
        this.columns = (_c = args.columns) !== null && _c !== void 0 ? _c : 99;
        this.scale = (_d = args.scale) !== null && _d !== void 0 ? _d : new Vector(1, 1);
        this.fps = (_e = args.fps) !== null && _e !== void 0 ? _e : 30;
        // calculating offset given combination of pixel offset and row/column sizing
        const offset = (_f = args.offset) !== null && _f !== void 0 ? _f : new Vector();
        const row = (_g = args.row) !== null && _g !== void 0 ? _g : 1;
        const column = (_h = args.column) !== null && _h !== void 0 ? _h : 1;
        this.offset = new Vector(offset.x + ((column - 1) * this.size.x), offset.y + ((row - 1) * this.size.y));
    }
    render(ctx, column, row) {
        let sx = clamp(this.offset.x + (column * this.size.x), 0, this.sheet.width - this.size.x);
        let sy = clamp(this.offset.y + (row * this.size.y), 0, this.sheet.height - this.size.y);
        ctx.drawImage(this.sheet, sx, sy, this.size.x, this.size.y, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    }
    // TODO: create function that returns animation task
    // "anim.run()" returns task
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
    constructor(args) {
        var _a;
        this.column = 0;
        this.row = 0;
        this.resolvers = [];
        /** milliseconds spent on current frame. will advance to next frame when this exceeds mspf */
        this.timer = 0;
        /** current loop # */
        this.loop = 0;
        this.anim = args.anim;
        this.fps = (_a = args.fps) !== null && _a !== void 0 ? _a : 30;
        /** seconds per frame */
        this.sfp = 1 / this.fps;
        this.dispose = args.dispose;
        this.numLoops = args.numLoops;
    }
    wait() {
        // create a new promise and it's resolve method to the resolver array
        //  when this animation is finished, it will resolve all promises that are currently waiting
        return new Promise(resolve => this.resolvers.push(resolve));
    }
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
            this.resolvers.forEach(resolve => resolve(null));
        }
        return finished;
    }
    render(ctx) {
        this.anim.render(ctx, this.column, this.row);
    }
}
/** stationary object that gets updated/rendered until animation is complete */
export class AnimationObject extends GameObject {
    constructor(args) {
        super(args);
        this.anim = args.anim;
    }
    update(deltaTime) {
        console.log("updating animation object!");
        super.update(deltaTime);
        return this.anim.update(deltaTime);
    }
    render(ctx) {
        super._render(ctx, () => {
            this.anim.render(ctx);
        });
    }
    static Promise(args) {
        return new Promise(resolve => {
            args.dispose = self => resolve(self);
            new AnimationObject(args);
        });
    }
}
/** @enum {number} *
const directions = {
    UP: 0,
    LEFT: 1,
    DOWN: 2,
    RIGHT: 3
}

/* converts angle to direction
 * @param {number} angle *
function getDirection(angle) {
    const a = mod(angle, Math.PI * 2);
    const quad = Math.PI / 4;
    if (a > quad * 7)  return directions.UP;
    if (a > quad * 5)  return directions.LEFT;
    if (a > quad * 3)  return directions.DOWN;
    if (a > quad) return directions.RIGHT;
    return directions.UP;
}*/
