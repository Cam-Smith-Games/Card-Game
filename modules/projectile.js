import { GameObject } from './gameobject.js';
import { CircleLight } from './light.js';
import Transform from './transform.js';

/** 
 * @typedef {import('./battle').Battle} Battle
 * @typedef {import('./animation').AnimationTask} AnimationTask
 * @typedef {import('./gameobject').GameObjectArgs} GameObjectArgs
 * @typedef {import('./vector').default} Vector
 * 
 * @typedef {Object} ProjectileArgs
 * @property {string} [color] 
 * @property {Vector} velocity
 * @property {Vector} target
 * @property {AnimationTask} [anim]
 */

export class Projectile extends GameObject {
    /** @param {ProjectileArgs & GameObjectArgs} args */
    constructor(args) {
        super(args);

        this.color = args.color;
        this.target = args.target;
        this.velocity = args.velocity;
        this.anim = args.anim;

        new CircleLight({
            transform: new Transform({
                pos: this.transform.pos 
            }),
            parent: this,
            radius: 10
        });
    }

    /** every frame, point toward toward and move {velocity*deltaTime} units forward relative to angle
     * @param {number} deltaTime 
     * @returns {boolean} boolean specifying whether to keep updating this projectile (false if dsposed) 
     * */
     update(deltaTime) {
        super.update(deltaTime);

        this.transform.angle = this.target.angleTo(this.transform.pos);
        const rot = this.velocity.rotate(this.transform.angle).multiply(deltaTime)
        this.transform.pos = this.transform.pos.add(rot);
        if (this.anim) {
            this.anim.update(deltaTime);
        }

        // dispose when within x distance from target
        return this.transform.pos.dist(this.target) < this.transform.size.y;
    }
    
    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        super.render(ctx);

       // ctx.translate(this.transform.pos.x, this.transform.pos.y);
        //ctx.rotate(this.angle);

        this.transform.render(ctx, () => {

            if (this.anim) {
                this.anim.render(ctx, this.transform.size);
            }
            else {
                ctx.fillStyle = this.color;
                ctx.fillRect(0, 0, this.transform.size.x, this.transform.size.y);
            }

        });


        //ctx.rotate(-this.angle);
        //ctx.translate(-this.transform.pos.x, -this.transform.pos.y);
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