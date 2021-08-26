import Vector from "./vector.js";

/**
 * @typedef {Object} AnimationOptions
 * @property {HTMLImageElement} [sheet]
 * @property {Vector} [frameSize]
 * @property {number} [numColumns]
 * @property {number} [numRows]
 * @property {number} [frameDelay]
 */

/** this is a simple ass animation, no angles or grouping are involved, it just loops thru spritesheet rows/columns indefinitely  */
export class SimpleAnimation {

    /**
     * 
     * @param {AnimationOptions} args 
     */
    constructor(args = {}) {
        this.sheet = args.sheet instanceof HTMLImageElement ? args.sheet : new HTMLImageElement();
        this.frameSize = args.frameSize instanceof Vector ? args.frameSize : new Vector();
        this.numColumns = typeof args.numColumns === "number" ? args.numColumns : 0;
        this.numRows = typeof args.numRows === "number" ? args.numRows : 0;
        this.frameDelay = typeof args.frameDelay === "number" ? args.frameDelay : 0.1; 

        this.column = 0;
        this.row = 0;
        this.timer = 0;
    }

    /**
     * 
     * @param {number} deltaTime 
     */
    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer >= this.frameDelay) {
            this.column++;
            if (this.column > this.numColumns - 1) {
                this.column = 0;
                this.row = (this.row + 1) % this.numRows;
            }

            this.timer = 0;
        }
    }


    /**
     * 
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector} position 
     * @param {Vector} size
     * @param {number} [angle] 
     * @param {number} [alpha]
     */
    draw(ctx, position, size, angle = 1, alpha = 1) {
        const sx = this.column * this.frameSize.x;
        const sy = this.row * this.frameSize.y;

        const alpha_before = ctx.globalAlpha;
        ctx.globalAlpha = alpha;
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
        ctx.drawImage(this.sheet, sx, sy, this.frameSize.x, this.frameSize.y, -size.x/2, -size.y/2, size.x, size.y);
        ctx.rotate(-angle);
        ctx.translate(-position.x, -position.y);
        ctx.globalAlpha = alpha_before;

    }
}

/*
class AnimationGroup {
    // "directions": (ORDER MATTERS) maps each row of this animation group to a direction (i.e. for LPC sprite sheets, each animation has 4 directions, with order = [up,left,down,right])
    constructor(animation, args = {}) {
        this.animation = animation;
        this.index = typeof args.index === "number" ? args.index : 0;
        this.directions = Array.isArray(args.directions) ? args.directions : [OrthographicAnimation.Directions.UP, OrthographicAnimation.Directions.LEFT, OrthographicAnimation.Directions.DOWN, OrthographicAnimation.Directions.RIGHT];
        this.numFrames = typeof args.numFrames === "number" ? args.numFrames : 0;

        this.startFrame = typeof args.startFrame === "number" && args.startFrame > 0 && args.startFrame < this.numFrames ? args.startFrame : 0;
        this.endFrame = typeof args.endFrame === "number" && args.endFrame > this.startFrame && args.endFrame < this.numFrames ? args.endFrame : this.numFrames - 1;

        this.frame = 0;
    }

    getDirection(angle) {
        let a = angle.mod(Math.PI * 2);

        let dir, quad = Math.PI / 4;
        if (a > quad) {
            dir = OrthographicAnimation.Directions.RIGHT;
            if (a > quad * 3) {
                dir = OrthographicAnimation.Directions.DOWN;
                if (a > quad * 5) {
                    dir = OrthographicAnimation.Directions.LEFT;
                    if (a > quad * 7) {
                        dir = OrthographicAnimation.Directions.UP;
                    }
                }
            }
        }
        else {
            dir = OrthographicAnimation.Directions.UP;
        }

        return dir;
    }

    draw(size, offset, angle = 0, alpha = 1) {

        let dir = this.getDirection(angle);
        let row = this.directions[dir] + this.row_offset;

        let sx = this.animation.frame * this.animation.frameSize.x;
        let sy = row * this.animation.frameSize.y;

        
        //let size = gameObject instanceof GameObject.Circle ? new Vector(gameObject.radius * 2, gameObject.radius * 2) : gameObject.size;
        //let offset = size.divide(-2);

        ctx.globalAlpha = alpha;
        //ctx.translate(gameObject.position.x, gameObject.position.y);
        //ctx.rotate(gameObject.angle);
        ctx.drawImage(this.animation.sheet, sx, sy, this.animation.frameSize.x, this.animation.frameSize.y, offset.x, offset.y, size.x, size.y);
        //ctx.rotate(-gameObject.angle);
        //ctx.translate(-gameObject.position.x, -gameObject.position.y);
        ctx.globalAlpha = 1
    }

}

// this is more complex animation: it allows for grouping a sprite sheet into separate "groups" (AnimationGroup) 
// each group can include multiple directions (defaults to up/down/left/right), and each can have a different number of frames
class OrthographicAnimation {
    // "groups" dictionary of args for AnimationGroup class
    constructor(args = {}) {
        let groupKeys = [];
        if (args.groups && typeof args.groups === "object") {
            groupKeys = Object.keys(args.groups);
        }

        this.groups = [];
        this.group_map = {};

        if (groupKeys) {
            groupKeys.map(key => {
                let group = new AnimationGroup(this, args.groups[key]);
                this.groups.push(group);
                this.group_map[key] = group;
            });

            // setting row offset for each group (comes from summing numRows on each previous group (i.e. lower index))
            this.groups.forEach(group => {
                group.row_offset = this.groups.filter(g => g.index < group.index)
                        .reduce((total, g) => total += g.directions.length, 0);
            })

            this.group = this.groups[0];
        }
        else {
            this.group = null;
        }


        this.sheet = args.sheet instanceof Image ? args.sheet : new Image();
        this.frameSize = args.frameSize instanceof Vector ? args.frameSize : new Vector();
        this.frameDelay = typeof args.frameDelay === "number" ? args.frameDelay : 0.1; 
        this.frame = this.group ? this.group.startFrame : 0;
        this.timer = 0;

        this.numLoops = 0;
        this.loopCount = 0;
    }

    set(group, numLoops = 0) {
        if (group in this.group_map) {
            this.group_prev = this.group;
            this.group = this.group_map[group];
            this.timer = 0;
            this.frame = this.group.startFrame;
            this.loopCount = 0;
            this.numLoops = numLoops;
        }
    }

    once(group) {
        if (group in this.group_map) {
            if (this.group_prev != this.group) {
                this.group_prev = this.group;
            }
            this.group = this.group_map[group];
            this.timer = 0;
            this.frame = this.group.startFrame;
            this.loopCount = 0;
            this.numLoops = 1;
        }
    }

    // only iterate thru are columns, the row gets set on draw based on angle
    // TODO: need to support vertical sprite sheets? hardly ever see them oriented that way so ignoring for now
    update(deltaTime) {
        this.timer += deltaTime;
  
        if (this.timer >= this.frameDelay) {
    
            if (++this.frame > this.group.endFrame) {
                this.frame = this.group.startFrame;
                if (this.numLoops > 0 && ++this.loopCount > this.numLoops - 1) {
                    this.group = this.group_prev;
                    this.numLoops = 0;
                    this.loopCount = 0;
                }
            }

            this.timer = 0;
        }
    }

    draw(size = new Vector(), offset = new Vector(), angle = 0, alpha = 1) {
        if (this.group) {
            this.group.draw(size, offset, angle, alpha);
        }
    }
}

OrthographicAnimation.Directions = {
    UP: 0,
    LEFT: 1,
    DOWN: 2,
    RIGHT: 3
}
*/