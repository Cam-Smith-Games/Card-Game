import { GameObject } from './gameobject.js';
import { CircleLight } from './light.js';
import Transform from './transform.js';
export class Projectile extends GameObject {
    constructor(args) {
        super(args);
        this.color = args.color;
        this.target = args.target;
        this.velocity = args.velocity;
        this.anim = args.anim;
        new CircleLight({
            transform: new Transform({
                pos: this.pos
            }),
            parent: this,
            radius: 10
        });
    }
    /** every frame, point toward toward and move {velocity*deltaTime} units forward relative to angle
     * @returns {boolean} boolean specifying whether to keep updating this projectile (false if dsposed)
     * */
    update(deltaTime) {
        super.update(deltaTime);
        this.transform.angle = this.target.angleTo(this.pos);
        const rot = this.velocity.rotate(this.transform.angle).multiply(deltaTime);
        this.pos = this.pos.add(rot);
        if (this.anim) {
            this.anim.update(deltaTime);
        }
        // dispose when within x distance from target
        return this.pos.dist(this.target) < this.size.y;
    }
    render(ctx) {
        super.render(ctx);
        // ctx.translate(this.pos.x, this.pos.y);
        //ctx.rotate(this.angle);
        this.transform.render(ctx, () => {
            if (this.anim) {
                this.anim.render(ctx, this.size);
            }
            else {
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
            }
        });
        //ctx.rotate(-this.angle);
        //ctx.translate(-this.pos.x, -this.pos.y);
    }
    static Promise(args) {
        return new Promise(resolve => {
            args.dispose = self => resolve(self);
            new Projectile(args);
        });
    }
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
