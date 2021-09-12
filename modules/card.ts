import { Projectile } from "./engine/objects/projectile.js";
import { Vector } from "./engine/util/vector.js";
import Announcement from "./engine/objects/announce.js";
import { AnimationObject, AnimationTask } from "./engine/animation.js";
import { Character } from "./character.js";
import { Battle } from "./battle.js";
import { CircleLight } from "./engine/objects/light.js";
import { TransformArgs } from "./engine/transform.js";


export const enum elements {
    PHYSICAL = "physical",
    FIRE ="fire",
    ICE = "ice",
    WATER = "water",
    LIGHTNING = "lightning",
    AIR = "air",
    LIGHT = "light",
    DARK = "dark"
};



/** Maps each element to a resistance value (each point of resistance negates 1 damage). 
 * @note This needs to be consistent with elements enum. JSDoc doesn't appear to support {Object<enum,number>} */
export interface Resistance {
    physical?: number;
    fire?: number;
    ice?: number;
    water?: number;
    lightning?: number;
    air?: number;
    light?: number;
    dark?: number;
}





interface AnimateCallback {
    /** 
     * @param {Battle} battle battle container (used to inject projects etc)
     * @param {Character} caster character that casted spell
     * @param {Character[]} targets targets that were cast on
     * @param {number[]} damage damage dealt to each target (aligned by index)
     * @returns {Promise<any>} resolves once animation is complete
     */
    (battle: Battle, caster: Character, targets: Character[], damage: number[]) : Promise<any>
}
interface CastCallback {
    /** returns damage to apply to each character (linked on index) */
    (caster: Character, targets: Character[]) : number[]
}


// TODO: create an "AbilityDefinition" class thats stripped down to not include "charges" and other character-specific attributes
//      characters would contain instances of AbilityDefinitions in the form a "CharacterAbilities" which contain instance-specific values such as 
//      current charges, multipliers, or w/e else might be unique to a specific characters ability instance

export interface CardArgs {
    name: string;
    description: string;
    /** arbitrary number used for calculating effectiveness of ability. Can be healing power, damage multiplier, etc. Depends on the spell */
    power: number;
    /** number of ability points required to cast this spell*/ 
    cost?:number;
     /** max number of targets. defaults to 1 */ 
    maxTargets?:number;
    /** 0-1 rating representing consistency of damage. stability=0 means damage will be very random, ranging from 0 - (2*power), stability=1 means damage will be very consistent, always equal to power. default = 1*/   
    stability?:number;   
    /** 0-1 chance to crit. defaults to 0*/ 
    critChance?:number; 
    /**  multiplier to apply for critical hits. defaults to 1.25.*/
    critMultiplier?:number;
    /** 0-1 chance to hit. defaults to 1 */ 
    accuracy?:number; 

    /** type of ability (used to determine which defensive attributes to apply to use when calculating damage). default = physical */
    type?: elements;

    /** color to apply when display spell name */
    color: string;

    /** returns animation to wait for upon ability execution */
    anim?: () => AnimationTask;

    /** image to display on card */
    icon? : string;
}

export class Card {

    name: string;
    description: string;
    power: number;
    cost: number;
    accuracy: number;
    maxTargets: number;
    critChance: number;
    critMultiplier: number;
    stability: number;
    type: elements;
    color: string;
    icon: string;
    animate: AnimateCallback;
    cast: (battle: Battle, caster: Character, targets: Character[]) => Promise<any>;

    /** 
     * @param {CardArgs} args
     * @param {CastCallback} cast function to run when executing this ability
     * @param {AnimateCallback} [animate] async function that resolves once animation is complete (called after casting)
    */
    constructor(args: CardArgs, cast : CastCallback, animate : AnimateCallback = null) {
        this.name = args.name;
        this.description = args.description;
        this.power = args.power;
        this.cost = args.cost ?? 1;
        this.accuracy = args.accuracy ?? 1;
        this.maxTargets = args.maxTargets ?? 1;
        this.critChance = args.critChance ?? 0;
        this.critMultiplier  = args.critMultiplier ?? 1.25;
        this.stability = args.stability ?? 1;
        this.type = args.type ?? elements.PHYSICAL;
        this.color = args.color ?? "gray";

        this.icon = args.icon ?? "";
        this.animate = animate ?? (() => Promise.resolve());

        this.cast = function(battle: Battle, caster: Character, targets: Character[]) {
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
        ).data("card", this);
    }
}

interface DamageResult {
    miss?: boolean;
    critical?: boolean;
    damage_initial?: number;
    resist?: number;

}

/** basic ablity that causes damage or heals (if damage is negative) */
export class BasicCard extends Card {
        /** 
         * @param {CardArgs} args 
         * @param {AnimateCallback} [animate] async function that resolves once animation is complete (called after casting)
        */
        constructor(args: CardArgs, animate: AnimateCallback = null) {
            super(args, 
                // CAST: calculate damage to apply to each target and log 
                (caster, targets) => targets.map(target => {
                    const result: DamageResult = {};
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
     * @param {DamageResult} result result object to inject status into
     * @todo take targets defensive stats into account (i.e. dodge, armor, etc) this is tough because then damage needs to be magic vs physical
     * @todo run simulation test to make sure these percentages are correct
     */
    getDamage(target : Character, result : DamageResult) {
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

interface ProjectileCardArgs extends CardArgs,TransformArgs {

}

/** these abilities shoot a projectile and wait for impact */
export class ProjectileAbility extends BasicCard {
    constructor(args : ProjectileCardArgs) {
        super(args, 
            // ANIMATE: wait for caster cast animation -> wait for projectile -> wait for damage animation

            async (battle:Battle, caster:Character, targets:Character[], damage:number[]) => {
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
                return Promise.all(
                    targets.map((target,i) => 
                        Projectile.Promise({
                            pos: caster.pos,
                            size: args.size ?? new Vector(30, 75),
                            color: this.color, 
                            children: [
                                new CircleLight({
                                    color: this.color
                                })
                            ],
                            target: target.pos,
                            velocity: args.velocity ?? new Vector(0, 2500),
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
                        })
                    )
                );
            }
            
        );
    }
}

export class MeleeCard extends BasicCard {
    constructor(args : CardArgs) {
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

            
      
  
                return Promise.all(
                    targets.map(async (target,i) => {

                        // TODO: wait for walk animation (essentially projectile's code but for the game object itself. and slower default velocity)

                        let offset = caster.size.multiply(caster.scale);

                        console.log("hello: ", caster.scale);

                        // if character is not flipped, offset to left
                        if (!caster.flipped) {
                            offset.x *= -1
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

                    })
                )
                // return to start position
                .then(() => caster.pos = prevPos);
            }
            
        );
    }
}

/** either does nothing, or spawns an animation at target */
export class SimpleCard extends BasicCard {
    constructor(args : CardArgs) {
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

                    })
                );
            }
            
        );
    }
}
