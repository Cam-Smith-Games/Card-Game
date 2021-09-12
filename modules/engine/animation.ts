import { GameObject, GameObjectArgs } from "./objects/gameobject.js";
import { clamp } from "./util/math.js";
import { Vector } from "./util/vector.js";




interface AnimArgs {
    /** NOTE this is a required field on either Sheet or Animation but not both. It's only defined as optional to avoid warnings */
    sheet?: HTMLImageElement;
    /** size of each frame. currently donesn't support different sizes for each frame */
    frameSize?: Vector;
    fps?: number;
}

interface SpriteAnimArgs extends AnimArgs {
    /** size of this group (can span across multiple rows/columns) */

    /** default = 1 */
    rows?: number;

    /** default = 99 */
    columns?: number;


     /** calculating start position  */
     /** pixels offset of this animation within sheet (default = 0) gets added to row/column if specified */ 
     offset?: Vector;
     /** NOTE: this starts at 1, not 0 */ 
     row?: number;
     /**  NOTE: this starts at 1, not 0 */
     column?: number; 

     /** scale multiplier that gets multiplied to size (negative values will flip) */
     scale?: Vector;
}



interface AnimationSheetArgs extends AnimArgs {
    /** list of configurations for each sprite animation */
    groups: Record<string,SpriteAnimArgs>;
}

// these properties are shared by sheet and animation 
// they can get defaulted at sheet level and then optionally overriden by each individual animation
const shared_options = ["sheet", "frameSize", "fps"];

/** Group of animations for entire sprite sheet */
export class AnimationSheet {

    sheet : HTMLImageElement;
    animations: Record<string, SpriteAnimation>;

    constructor(args : AnimationSheetArgs) {

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
  

    sheet: HTMLImageElement;
    size: Vector;
    rows: number;
    columns: number;
    scale: Vector;
    fps: number;
    offset: Vector;

    constructor(args : SpriteAnimArgs) {
        if (!args.sheet) throw "Sprite Animation Required a sheet.";
        
        this.sheet = args.sheet;
        this.size = args.frameSize ?? new Vector(64, 64);
        this.rows = args.rows ?? 1;
        this.columns = args.columns ?? 99;
        this.scale = args.scale ?? new Vector(1, 1);
        this.fps = args.fps ?? 30;

        // calculating offset given combination of pixel offset and row/column sizing
        const offset = args.offset ?? new Vector();
        const row = args.row ?? 1;
        const column = args.column ?? 1;
        this.offset = new Vector(
            offset.x + ((column-1) * this.size.x), 
            offset.y + ((row-1) * this.size.y)
        );
    }


    render(ctx : CanvasRenderingContext2D, column : number, row : number) {
        let sx = clamp(this.offset.x + (column * this.size.x), 0, this.sheet.width - this.size.x);
        let sy = clamp(this.offset.y + (row * this.size.y), 0, this.sheet.height - this.size.y);
        ctx.drawImage(this.sheet, sx, sy, this.size.x, this.size.y, -this.size.x/2, -this.size.y/2, this.size.x, this.size.y);
    }

    // TODO: create function that returns animation task
    // "anim.run()" returns task

    run(args: AnimationTaskArgs = {}) {
        args.anim = this;
        if (!args.fps) {
            args.fps = this.fps;
        }

        return new AnimationTask(args);
    }
}


interface AnimationTaskArgs {
    anim? : SpriteAnimation;
    
    /** number of times to loop before resolving task */
    numLoops?: number;

    /** default = 30 */
    fps?: number;
    
    dispose? : (task:AnimationTask) => void;

}
/** Task for playing a single animation. Can loop indefinitely or get disposed once a certain number of loops have played */
export class AnimationTask {
 
    anim: SpriteAnimation;
    fps: number;
    sfp: number;
    dispose: (task:AnimationTask) => void;
    numLoops: number;
    column: number = 0;
    row: number = 0;

    resolvers: ((value:unknown)=>void)[] = [];

    constructor(args : AnimationTaskArgs) {
        this.anim = args.anim;

        this.fps = args.fps ?? 30;
        /** seconds per frame */
        this.sfp =  1 / this.fps;

        this.dispose = args.dispose;
        this.numLoops = args.numLoops;

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

    update(deltaTime : number) {

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

    render(ctx : CanvasRenderingContext2D) {
        this.anim.render(ctx, this.column, this.row);
    }

}


interface AnimationObjectArgs extends GameObjectArgs {
    anim : AnimationTask;
}



/** stationary object that gets updated/rendered until animation is complete */
export class AnimationObject extends GameObject {

    anim: AnimationTask;
    
  
    constructor(args: AnimationObjectArgs) {
        super(args);
        this.anim = args.anim;
    }

    update(deltaTime : number) {
        console.log("updating animation object!");
        super.update(deltaTime);
        return this.anim.update(deltaTime);
    }

    render(ctx : CanvasRenderingContext2D) {
        super._render(ctx, () => {
            this.anim.render(ctx);
        });
    }

    static Promise(args: AnimationObjectArgs) {
        return new Promise(resolve => {
            args.dispose = self => resolve(self);
            new AnimationObject(args);
        })
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



