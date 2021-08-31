import { GameObject } from './gameobject.js';

/** 
 * @typedef {import('./battle').Battle} Battle
 * @typedef {import('./animation').AnimationTask} AnimationTask
 * @typedef {import('./gameobject').GameObjectArgs} GameObjectArgs
 * @typedef {import('./vector').default} Vector
 * 
 * @typedef {Object} ProjectileArgs
 * @property {string} [color] 
 * @property {Vector} pos
 * @property {Vector} size
 * @property {Vector} velocity
 * @property {Vector} target
 * @property {AnimationTask} [anim]
 */

export class Projectile extends GameObject {
    /** @param {ProjectileArgs & GameObjectArgs} args */
    constructor(args) {
        super(args);

        this.color = args.color;
        this.pos = args.pos;
        this.size = args.size;
        this.target = args.target;
        this.velocity = args.velocity;
        this.angle = 0;
        this.anim = args.anim;
    }

    /** every frame, point toward toward and move {velocity*deltaTime} units forward relative to angle
     * @param {number} deltaTime 
     * @returns {boolean} boolean specifying whether to keep updating this projectile (false if dsposed) 
     * */
     update(deltaTime) {
        super.update(deltaTime);

        this.angle = this.target.angleTo(this.pos);
        const rot = this.velocity.rotate(this.angle).multiply(deltaTime)
        this.pos = this.pos.add(rot);
        if (this.anim) {
            this.anim.update(deltaTime);
        }

        // dispose when within x distance from target
        return this.pos.dist(this.target) < 10;
    }
    
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        super.render(ctx);

        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        if (this.anim) {
            this.anim.render(ctx, this.size);
        }
        else {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, this.size.x, this.size.y);
        }

        ctx.rotate(-this.angle);
        ctx.translate(-this.pos.x, -this.pos.y);
    }
}



/** 
 * @param {ProjectileArgs & GameObjectArgs} args
 * @returns {Promise<GameObject>}
 */
Projectile.Promise = function(args) {
    return new Promise(resolve => {
        args.dispose = self => resolve(self);
        new Projectile(args);
    })
}



/*
 * 
 * @param {any} type 
 * @param {any} args 
 * @returns 
 *
function getNew(type, args) {
    return new Promise(resolve => {
        args.dispose = resolve;
        new type(args);  
    })
}*/