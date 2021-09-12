import { Projectile } from "./engine/objects/projectile.js";
import { Vector } from "./engine/util/vector.js";
import Announcement from "./engine/objects/announce.js";
import { AnimationObject } from "./engine/animation.js";
import { CircleLight } from "./engine/objects/light.js";
;
export class Card {
    /**
     * @param {CardArgs} args
     * @param {CastCallback} cast function to run when executing this ability
     * @param {AnimateCallback} [animate] async function that resolves once animation is complete (called after casting)
    */
    constructor(args, cast, animate = null) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.name = args.name;
        this.description = args.description;
        this.power = args.power;
        this.cost = (_a = args.cost) !== null && _a !== void 0 ? _a : 1;
        this.accuracy = (_b = args.accuracy) !== null && _b !== void 0 ? _b : 1;
        this.maxTargets = (_c = args.maxTargets) !== null && _c !== void 0 ? _c : 1;
        this.critChance = (_d = args.critChance) !== null && _d !== void 0 ? _d : 0;
        this.critMultiplier = (_e = args.critMultiplier) !== null && _e !== void 0 ? _e : 1.25;
        this.stability = (_f = args.stability) !== null && _f !== void 0 ? _f : 1;
        this.type = (_g = args.type) !== null && _g !== void 0 ? _g : "physical" /* PHYSICAL */;
        this.color = (_h = args.color) !== null && _h !== void 0 ? _h : "gray";
        this.icon = (_j = args.icon) !== null && _j !== void 0 ? _j : "";
        this.animate = animate !== null && animate !== void 0 ? animate : (() => Promise.resolve());
        this.cast = function (battle, caster, targets) {
            const damage = cast(caster, targets);
            return this.animate(battle, caster, targets, damage);
        };
    }
    getCard() {
        // TODO: when cost is modified by a buff, it will need to be changed here
        return $(`<article class='card'>
                <header>${this.name}</header>
                <i>${this.cost}</i>
                <img src='${this.icon}' />
                <footer>${this.description}</footer>
            </article>`).data("card", this);
    }
}
/** basic ablity that causes damage or heals (if damage is negative) */
export class BasicCard extends Card {
    /**
     * @param {CardArgs} args
     * @param {AnimateCallback} [animate] async function that resolves once animation is complete (called after casting)
    */
    constructor(args, animate = null) {
        super(args, 
        // CAST: calculate damage to apply to each target and log 
        (caster, targets) => targets.map(target => {
            const result = {};
            const damage = this.getDamage(target, result);
            // z-index issue../
            /*const miss_emojis = ['🤡', '😰', '😬', '💩'];
            Announcement.Promise({
                text: getRandom(miss_emojis),
                outline: false,
                transform: new Transform({
                    pos: target.pos
                }),
                parent: caster.parent
            });*/
            if (result.miss) {
                console.log(`${caster.name}'s %c${this.name}%c missed ${target.name}!`, { this: this, target: target }, `color:${this.color};font-weight:bold`, '');
            }
            else {
                const styles = [];
                let log = "";
                styles.push(`color:${this.color};font-weight:bold;font-style:italic;text-transform:uppercase;font-size:1.25em;`),
                    log += `${caster.name}'s %c${this.name} `;
                styles.push(``),
                    log += `%c${this.power > 0 ? "hits" : "heals"} ${target.name} for ${this.power > 0 ? damage : damage * -1}!`;
                if (result.critical) {
                    styles.push("color: #ffaadd; font-style: italic");
                    log += ` %c(CRITICAL ${this.critMultiplier}X DAMAGE) %c`;
                    styles.push("");
                }
                if (result.resist) {
                    log += ` %c(${result.resist} resisted by ${this.type} reistance)`;
                    styles.push("color: gray; font-style: italic;");
                }
                styles.push("");
                console.log(log, ...styles); //, result)
                target.hp -= damage;
            }
            return damage;
        }), animate);
    }
    /**
     * calculates damage/healing to apply to target (random given crit chance/multiplier and stability)
     * @param {import("./character").Character}  target
     * @param {DamageResult} result result object to inject status into
     * @todo take targets defensive stats into account (i.e. dodge, armor, etc) this is tough because then damage needs to be magic vs physical
     * @todo run simulation test to make sure these percentages are correct
     */
    getDamage(target, result) {
        var _a;
        const random = Math.random();
        // MISS
        const hitChance = this.accuracy * (1 - target.dodge);
        if (random > hitChance) {
            result.miss = true;
            return null;
        }
        let damage = this.power + ((1 - this.stability) * this.power);
        result.damage_initial = damage;
        // CRIT
        if (this.critChance != 0 && random <= this.critChance) {
            result.critical = true;
            damage *= this.critMultiplier;
        }
        // don't apply resistance to healing abilities
        if (this.power > 0) {
            // APPLYING RESISTANCE
            // @ts-ignore
            result.resist = (_a = target.defense[this.type]) !== null && _a !== void 0 ? _a : 0;
            damage = Math.max(0, damage - result.resist);
        }
        return damage;
    }
}
/** these abilities shoot a projectile and wait for impact */
export class ProjectileAbility extends BasicCard {
    constructor(args) {
        super(args, 
        // ANIMATE: wait for caster cast animation -> wait for projectile -> wait for damage animation
        async (battle, caster, targets, damage) => {
            // if caster has an animation with this ability's name, run it and wait for it to finish
            if (this.name in caster.animations) {
                const prevAnim = caster.anim;
                caster.anim = caster.animations[this.name]();
                // wait for cast animation
                await caster.anim.wait().then(() => caster.anim = prevAnim);
            }
            //else {
            //    console.error(`${caster.name} is missing animation for projectile ability ${this.name}.`);
            //}
            // wait for all projectiles to reach their targets
            return Promise.all(targets.map((target, i) => {
                var _a, _b;
                return Projectile.Promise({
                    pos: caster.pos,
                    size: (_a = args.size) !== null && _a !== void 0 ? _a : new Vector(30, 75),
                    color: this.color,
                    children: [
                        new CircleLight({
                            color: this.color
                        })
                    ],
                    target: target.pos,
                    velocity: (_b = args.velocity) !== null && _b !== void 0 ? _b : new Vector(0, 2500),
                    anim: args.anim ? args.anim() : null,
                    parent: battle,
                    offset: args.offset
                })
                    .then(_ => {
                    console.log("applying damage");
                    let dmg = damage[i];
                    return Announcement.Promise({
                        text: Math.abs(dmg).toString(),
                        // heals are green, damage is red
                        r: dmg > 0 ? 255 : 0,
                        g: dmg < 0 ? 255 : 0,
                        pos: target.pos,
                        parent: battle
                    });
                });
            }));
        });
    }
}
export class MeleeCard extends BasicCard {
    constructor(args) {
        super(args, 
        // ANIMATE: wait for caster cast animation -> wait for animation -> wait for damage animation
        /**
         * @param {import('./battle').Battle} battle
         * @param {import("./character").Character} caster
         * @param {import("./character").Character[]} targets
         * @param {number[]} damage
         */
        async (battle, caster, targets, damage) => {
            // remember start position to come back to it when finished
            let prevPos = caster.pos;
            return Promise.all(targets.map(async (target, i) => {
                // TODO: wait for walk animation (essentially projectile's code but for the game object itself. and slower default velocity)
                let offset = caster.size.multiply(caster.scale);
                console.log("hello: ", caster.scale);
                // if character is not flipped, offset to left
                if (!caster.flipped) {
                    offset.x *= -1;
                }
                offset.y = 0;
                caster.pos = target.pos.add(offset);
                // if caster has an animation with this ability's name, run it and wait for it to finish
                if (this.name in caster.animations) {
                    const prevAnim = caster.anim;
                    caster.anim = caster.animations[this.name]();
                    await caster.anim.wait().then(() => caster.anim = prevAnim);
                }
                else {
                    console.error(`${caster.name} is missing animation for melee ability ${this.name}.`);
                }
                let dmg = damage[i];
                await Announcement.Promise({
                    text: dmg == 0 ? "" : Math.abs(dmg).toString() + "😂",
                    outline: false,
                    // heals are green, damage is red
                    r: dmg > 0 ? 255 : 0,
                    g: dmg < 0 ? 255 : 0,
                    pos: target.pos,
                    parent: battle
                });
            }))
                // return to start position
                .then(() => caster.pos = prevPos);
        });
    }
}
/** either does nothing, or spawns an animation at target */
export class SimpleCard extends BasicCard {
    constructor(args) {
        super(args, 
        // ANIMATE: wait for caster cast animation -> wait for animation -> wait for damage animation
        /**
         * @param {import('./battle').Battle} battle
         * @param {import("./character").Character} caster
         * @param {import("./character").Character[]} targets
         * @param {number[]} damage
         */
        async (battle, caster, targets, damage) => {
            // if caster has an animation with this ability's name, run it and wait for it to finish
            if (this.name in caster.animations) {
                const prevAnim = caster.anim;
                caster.anim = caster.animations[this.name]();
                await caster.anim.wait().then(() => caster.anim = prevAnim);
            }
            else {
                console.log(`Caster ${caster.name} is missing animation for ability ${this.name}.`);
            }
            return Promise.all(targets.map(async (target, i) => {
                await AnimationObject.Promise({
                    pos: target.pos,
                    // TODO: size needs to be configurable
                    size: new Vector(256, 256),
                    anim: args.anim ? args.anim() : null,
                    parent: battle
                });
                let dmg = damage[i];
                await Announcement.Promise({
                    text: Math.abs(dmg).toString(),
                    // heals are green, damage is red
                    r: dmg > 0 ? 255 : 0,
                    g: dmg < 0 ? 255 : 0,
                    pos: target.pos,
                    parent: battle
                });
            }));
        });
    }
}
