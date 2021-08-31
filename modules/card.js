import { Projectile } from "./projectile.js";
import Vector from "./vector.js";
import Announcement from "./announce.js";
import Transform from "./transform.js";
import { AnimationObject } from "./animation.js";
import { getRandom } from "./random.js";

/** @typedef {import('./animation').AnimationTask} AnimationTask */

/** @enum {string} */
export const elements = {
    PHYSICAL:  "physical",
    FIRE: "fire",
    ICE: "ice",
    WATER: "water",
    LIGHTNING: "lightning",
    AIR: "air",
    LIGHT: "light",
    DARK: "dark"
};



/** Maps each element to a resistance value (each point of resistance negates 1 damage). 
 * @note This needs to be consistent with elements enum. JSDoc doesn't appear to support {Object<enum,number>}
 * @typedef {Object} Resistance 
 * @property {number} [physical]
 * @property {number} [fire]
 * @property {number} [ice]
 * @property {number} [water]
 * @property {number} [lightning]
 * @property {number} [air]
 * @property {number} [light]
 * @property {number} [dark]
 */






/** 
 * @callback AnimateCallback
 * @param {import("./battle").Battle} battle battle container (used to inject projects etc)
 * @param {import("./character").Character} caster character that casted spell
 * @param {import("./character").Character[]} targets targets that were cast on
 * @param {number[]} damage damage dealt to each target (aligned by index)
 * @returns {Promise<any>} resolves once animation is complete
 */

/** 
 * @callback CastCallback
 * @param {import("./character").Character} caster
 * @param {import("./character").Character[]} targets
 * @returns {number[]} damage dealt to each character
 */


// TODO: create an "AbilityDefinition" class thats stripped down to not include "charges" and other character-specific attributes
//      characters would contain instances of AbilityDefinitions in the form a "CharacterAbilities" which contain instance-specific values such as 
//      current charges, multipliers, or w/e else might be unique to a specific characters ability instance

export class Card {



    /** 
     * @typedef {Object} CardArgs
     * @property {string} name
     * @property {string} description
     * @property {number} power arbitrary number used for calculating effectiveness of ability. Can be healing power, damage multiplier, etc. Depends on the spell
     * @property {number} [cost] number of ability points required to cast this spell
     * @property {number} [maxTargets] max number of targets. defaults to 1 
     * @property {number} [stability] 0-1 rating representing consistency of damage. stability=0 means damage will be very random, ranging from 0 - (2*power), stability=1 means damage will be very consistent, always equal to power. default = 1
     * @property {number} [critChance] 0-1 chance to crit. defaults to 0
     * @property {number} [critMultiplier] multiplier to apply for critical hits. defaults to 1.25.
     * @property {number} [accuracy] 0-1 chance to hit. defaults to 1 
     * @property {elements} [type] type of ability (used to determine which defensive attributes to apply to use when calculating damage). default = physical
     * @property {string} color color to apply when display spell name
     * @property {function():AnimationTask} [anim] returns animation to wait for upon ability execution
     * @property {string} [icon] image to display on card
    */

    /** 
     * @param {CardArgs} args
     * @param {CastCallback} cast function to run when executing this ability
     * @param {AnimateCallback} [animate] async function that resolves once animation is complete (called after casting)
    */
    constructor(args, cast, animate) {
        this.name = args.name;
        this.description = args.description;
        this.power = args.power;
        this.cost = args.cost ?? 1;
        this.accuracy = args.accuracy ?? 1;
        this.maxTargets = args.maxTargets ?? 1;
        this.critChance = args.critChance ?? 0;
        this.critMultiplier  = args.critMultiplier ?? 1.25;
        this.stability = args.stability ?? 1;
        /** @type {elements} */
        this.type = args.type ?? "physical";
        this.color = args.color ?? "gray";

        this.icon = args.icon ?? "";
        this.animate = animate ?? (() => Promise.resolve());

        /** 
         * @param {import('./battle').Battle} battle
         * @param {import("./character").Character} caster
         * @param {import("./character").Character[]} targets
         * @returns {Promise<any>}
         */
        this.cast = function(battle, caster, targets) {
            const damage = cast(caster, targets);         
            return this.animate(battle, caster, targets, damage);
        }

    }

    getCard() {
        // TODO: when cost is modified by a buff, it will need to be changed here
        return $(
            `<article class='card'>
                <header>${this.name}</header>
                <i>${this.cost}</i>
                <img src='${this.icon}' />
                <footer>${this.description}</footer>
            </article>`
        );
    }
}


/** basic ablity that causes damage or heals (if damage is negative) */
export class BasicCard extends Card {
        /** 
         * @param {CardArgs} args 
         * @param {AnimateCallback} [animate] async function that resolves once animation is complete (called after casting)
        */
        constructor(args, animate) {
            super(args, 
                // CAST: calculate damage to apply to each target and log 
                (caster, targets) => targets.map(target => {
                    /** @type {any} */
                    const result = {};
                    const damage = this.getDamage(target, result);


                    // z-index issue../
                    /*const miss_emojis = ['🤡', '😰', '😬', '💩'];
                    Announcement.Promise({
                        text: getRandom(miss_emojis),
                        outline: false,
                        transform: new Transform({
                            pos: target.transform.pos
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
                        log += `%c${this.power > 0 ? "hits" : "heals"} ${target.name} for ${this.power > 0 ? damage : damage*-1}!`;
                        
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
                }),
                animate
            );
        }



    /**
     * calculates damage/healing to apply to target (random given crit chance/multiplier and stability)
     * @param {import("./character").Character}  target
     * @param {any} result result object to inject status into
     * @todo take targets defensive stats into account (i.e. dodge, armor, etc) this is tough because then damage needs to be magic vs physical
     * @todo run simulation test to make sure these percentages are correct
     */
    getDamage(target, result) {
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
            result.resist = target.defense[this.type] ?? 0;
            damage = Math.max(0, damage - result.resist);
        }

        return damage;  
    }

}

/** these abilities shoot a projectile and wait for impact */
export class ProjectileAbility extends BasicCard {
    /** @param {CardArgs} args */
    constructor(args) {
        super(args, 
            // ANIMATE: wait for caster cast animation -> wait for projectile -> wait for damage animation
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
                    console.error(`${caster.name} is missing animation for projectile ability ${this.name}.`);
                }
  
                return Promise.all(
                    targets.map((target,i) => 
                        Projectile.Promise({
                            color: this.color, 
                            transform: new Transform({
                                pos: caster.transform.pos,
                                size: new Vector(30, 75)
                            }),
                            target: target.transform.pos,
                            // TODO: velocity needs to be configurable
                            velocity: new Vector(0, 2500),
                            anim: args.anim ? args.anim() : null,
                            parent: battle
                        })
                        .then(_ => {
                            let dmg = damage[i];
                            return Announcement.Promise({
                                text: Math.abs(dmg).toString(),
                                // heals are green, damage is red
                                r: dmg > 0 ? 255 : 0,
                                g: dmg < 0 ? 255 : 0,
                                transform: new Transform({
                                    pos: target.transform.pos
                                }),
                                parent: battle
                            });
                        })
                    )
                );
            }
            
        );
    }
}

export class MeleeCard extends BasicCard {
    /** @param {CardArgs} args */
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
                let prevPos = caster.transform.pos;

            
      
  
                return Promise.all(
                    targets.map(async (target,i) => {

                        // TODO: wait for walk animation (essentially projectile's code but for the game object itself. and slower default velocity)

                        let offset = caster.transform.size.multiply(caster.transform.scale);
                        offset.x -= caster.transform.size.x * 2;
                        offset.y = 0;
                        
                        caster.transform.pos = target.transform.pos.add(
                            caster.flipped ? offset = offset.multiply(new Vector(-1, 0)) : offset 
                        );

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
                            transform: new Transform({
                                pos: target.transform.pos
                            }),
                            parent: battle
                        });

                    })
                )
                // return to start position
                .then(() => caster.transform.pos = prevPos);
            }
            
        );
    }
}

/** either does nothing, or spawns an animation at target */
export class SimpleCard extends BasicCard {
    /** @param {CardArgs} args */
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
  
                return Promise.all(
                    targets.map(async (target,i) => {
                        await AnimationObject.Promise({
                            transform: new Transform({
                                pos: target.transform.pos,
                                // TODO: size needs to be configurable
                                size: new Vector(256, 256)
                            }),
                            anim: args.anim ? args.anim() : null,
                            parent: battle
                        });
    
                        let dmg = damage[i];
                        await Announcement.Promise({
                            text: Math.abs(dmg).toString(),
                            // heals are green, damage is red
                            r: dmg > 0 ? 255 : 0,
                            g: dmg < 0 ? 255 : 0,
                            transform: new Transform({
                                pos: target.transform.pos
                            }),
                            parent: battle
                        });

                    })
                );
            }
            
        );
    }
}
