import { AnimationTask } from '../animation.js';
import { GameObject, GameObjectArgs } from './gameobject.js';
import { Vector } from '../util/vector.js';



export interface ProjectileArgs extends GameObjectArgs {
    color?: string;
    velocity: Vector;
    target: Vector;
    anim?: AnimationTask;
}


export class Projectile extends GameObject {
    color: string;
    target: Vector;
    velocity: Vector;
    anim?: AnimationTask;

    constructor(args: ProjectileArgs) {
        super(args);

        this.color = args.color;
        this.target = args.target;
        this.velocity = args.velocity;
        this.anim = args.anim;
        console.log(this);
    }

    /** every frame, point toward toward and move {velocity*deltaTime} units forward relative to angle
     * @returns {boolean} boolean specifying whether to keep updating this projectile (false if dsposed) 
     * */
     update(deltaTime: number) {
        super.update(deltaTime);

        this.angle = this.target.angleTo(this.pos);
        const rot = this.velocity.rotate(this.angle).multiply(deltaTime)
        this.pos = this.pos.add(rot);
        if (this.anim) {
            this.anim.update(deltaTime);
        }

        // dispose when within x distance from target
        return this.pos.dist(this.target) < this.size.y;
    }
    
    render(ctx: CanvasRenderingContext2D) {

        super._render(ctx, () => {
            if (this.anim) {
                this.anim.render(ctx);
            }
            else {
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);
            }
        });
    }


    static Promise (args:ProjectileArgs) {
        return new Promise<GameObject>(resolve => {
            args.dispose = self => resolve(self);
            new Projectile(args);
        })
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