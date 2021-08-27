/** 
 * @typedef {Object} ProjectileArgs
 * @property {string} [color] 
 * @property {import('./vector').default} pos
 * @property {import('./vector').default} size
 * @property {import('./vector').default} velocity
 * @property {import ('./vector').default} target
 * @property {function():void} dispose function to call once project has completed it's path and needs to get disposed of
 */

export class Projectile {
    /** @param {ProjectileArgs} args */
    constructor(args) {
        console.log("~~~~ PROJECTILE INSTANTIATED ~~~~");

        this.color = args.color;
        this.pos = args.pos;
        this.size = args.size;
        this.target = args.target;
        this.velocity = args.velocity;
        this.angle = 0;
        this.dispose = args.dispose;
    }


    /** every frame, point toward toward and move {velocity*deltaTime} units forward relative to angle
     * @param {number} deltaTime 
     * @returns {boolean} boolean specifying whether to keep updating this projectile (false if dsposed) 
     * */
    update(deltaTime) {
        this.angle = this.target.angleTo(this.pos);
        let deg = this.angle * 180/Math.PI;
        const rot = this.velocity.rotate(this.angle).multiply(deltaTime/1000)
        this.pos = this.pos.add(rot);

        const disposed = this.pos.dist(this.target) < 10;
        if (disposed) {
            this.dispose();
        }
        return !disposed;
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.size.x, this.size.y);

        ctx.rotate(-this.angle);
        ctx.translate(-this.pos.x, -this.pos.y);
    }
}